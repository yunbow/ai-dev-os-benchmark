import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

const ALLOWED_PAYMENT_HOSTS = [
  "api.payment-provider.com",
  "api.sandbox.payment-provider.com",
];

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const PaymentWebhookEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "payment.succeeded",
    "payment.failed",
    "subscription.updated",
    "subscription.cancelled",
  ]),
  created: z.string().datetime(),
  data: z.object({
    userId: z.string().min(1),
    subscriptionId: z.string().min(1),
    status: z.enum(["active", "past_due", "cancelled", "trialing"]),
    currentPeriodEnd: z.string().datetime().optional(),
    planId: z.string().min(1).optional(),
  }),
});

type PaymentWebhookEvent = z.infer<typeof PaymentWebhookEventSchema>;

// ---------------------------------------------------------------------------
// SSRF Prevention: Certificate URL Validation (Section 3.5)
// ---------------------------------------------------------------------------

function isValidWebhookCertUrl(
  certUrl: string,
  allowedHosts: string[]
): boolean {
  try {
    const url = new URL(certUrl);
    if (url.protocol !== "https:") return false;
    return allowedHosts.some(
      (host) =>
        url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Timestamp Validation – Replay Attack Prevention (Section 3.3)
// ---------------------------------------------------------------------------

function validateTimestamp(timestamp: string): boolean {
  try {
    const eventTime = new Date(timestamp).getTime();
    const now = Date.now();
    if (now - eventTime > WEBHOOK_MAX_AGE_MS) {
      logger.warn(
        { timestamp, ageMs: now - eventTime },
        "Webhook rejected: event timestamp too old"
      );
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Signature Verification (Section 3.3)
// ---------------------------------------------------------------------------

async function verifyWebhookSignature(
  req: NextRequest
): Promise<{ valid: boolean; body?: PaymentWebhookEvent }> {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  // Optional SSRF guard: if the provider sends a certificate URL header,
  // validate it before use.
  const certUrl = headers["x-payment-cert-url"];
  if (certUrl !== undefined) {
    if (!isValidWebhookCertUrl(certUrl, ALLOWED_PAYMENT_HOSTS)) {
      logger.warn({ certUrl }, "Webhook rejected: invalid certificate URL");
      return { valid: false };
    }
  }

  const signature = headers["x-payment-signature"];
  const timestamp = headers["x-payment-timestamp"];

  if (!signature || !timestamp) {
    logger.warn("Webhook rejected: missing signature or timestamp header");
    return { valid: false };
  }

  // Timestamp check before expensive crypto work
  if (!validateTimestamp(timestamp)) {
    return { valid: false };
  }

  // HMAC-SHA256 verification using Web Crypto API (available in Edge/Node)
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("PAYMENT_WEBHOOK_SECRET is not configured");
    return { valid: false };
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSig = Buffer.from(signature, "hex");

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    expectedSig,
    encoder.encode(signedPayload)
  );

  if (!isValid) {
    logger.warn({ signature }, "Webhook rejected: invalid signature");
    return { valid: false };
  }

  // Validate body shape with Zod
  let parsed: PaymentWebhookEvent;
  try {
    parsed = PaymentWebhookEventSchema.parse(JSON.parse(rawBody));
  } catch (err) {
    logger.warn({ err }, "Webhook rejected: body failed schema validation");
    return { valid: false };
  }

  return { valid: true, body: parsed };
}

// ---------------------------------------------------------------------------
// Idempotency / Replay Prevention (Section 3.3)
// ---------------------------------------------------------------------------

async function markWebhookProcessing(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookEvent.findUnique({
    where: { externalId: eventId },
  });

  if (existing) {
    logger.info({ eventId }, "Webhook already processed, skipping");
    return false;
  }

  await prisma.webhookEvent.create({
    data: { externalId: eventId, status: "processing" },
  });

  return true;
}

async function markWebhookCompleted(eventId: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { externalId: eventId },
    data: { status: "completed", processedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Business Logic: Subscription Update
// ---------------------------------------------------------------------------

async function handlePaymentEvent(event: PaymentWebhookEvent): Promise<void> {
  const { userId, subscriptionId, status, currentPeriodEnd, planId } =
    event.data;

  switch (event.type) {
    case "payment.succeeded":
    case "subscription.updated": {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          externalId: subscriptionId,
          status,
          planId: planId ?? "default",
          currentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd)
            : null,
        },
        update: {
          externalId: subscriptionId,
          status,
          ...(planId && { planId }),
          ...(currentPeriodEnd && {
            currentPeriodEnd: new Date(currentPeriodEnd),
          }),
          updatedAt: new Date(),
        },
      });
      logger.info({ userId, subscriptionId, status }, "Subscription updated");
      break;
    }

    case "payment.failed": {
      await prisma.subscription.updateMany({
        where: { userId, externalId: subscriptionId },
        data: { status: "past_due", updatedAt: new Date() },
      });
      logger.info({ userId, subscriptionId }, "Subscription marked past_due");
      break;
    }

    case "subscription.cancelled": {
      await prisma.subscription.updateMany({
        where: { userId, externalId: subscriptionId },
        data: { status: "cancelled", updatedAt: new Date() },
      });
      logger.info({ userId, subscriptionId }, "Subscription cancelled");
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Signature + timestamp + schema verification
  const { valid, body: event } = await verifyWebhookSignature(req);
  if (!valid || !event) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Idempotency check – prevent replay attacks
  const shouldProcess = await markWebhookProcessing(event.id);
  if (!shouldProcess) {
    // Already handled; respond 200 so the provider does not retry
    return NextResponse.json({ received: true });
  }

  // 3. Process the event
  try {
    await handlePaymentEvent(event);
    await markWebhookCompleted(event.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    // Section 3.7: never leak stack traces; log internally only
    logger.error(
      { eventId: event.id, eventType: event.type, err },
      "Failed to process payment webhook"
    );

    // Mark as failed so it can be retried or investigated
    await prisma.webhookEvent
      .update({
        where: { externalId: event.id },
        data: { status: "failed" },
      })
      .catch(() => {
        // Best-effort; do not throw
      });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
