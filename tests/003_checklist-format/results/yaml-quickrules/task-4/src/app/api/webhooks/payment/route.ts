import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// SEC-13: Reject events older than 5 minutes
const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000;

// SEC-15: Allowed payment provider domains for certificate URL SSRF prevention
const ALLOWED_WEBHOOK_HOSTS = [
  "api.payment-provider.com",
  "api.sandbox.payment-provider.com",
];

// ─── Zod Schemas (SEC-03) ────────────────────────────────────────────────────

const PaymentStatusSchema = z.enum([
  "succeeded",
  "failed",
  "pending",
  "refunded",
  "disputed",
]);

const PaymentWebhookEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  created: z.number().int().positive(),
  data: z.object({
    object: z.object({
      id: z.string().min(1),
      customer: z.string().min(1),
      status: PaymentStatusSchema,
      amount: z.number().int().nonneg(),
      currency: z.string().length(3),
      subscription: z.string().optional(),
      metadata: z.record(z.string()).optional(),
    }),
  }),
});

type PaymentWebhookEvent = z.infer<typeof PaymentWebhookEventSchema>;

// ─── SSRF Prevention (SEC-15) ────────────────────────────────────────────────

function isValidWebhookCertUrl(
  certUrl: string,
  allowedHosts: string[]
): boolean {
  try {
    const url = new URL(certUrl);
    if (url.protocol !== "https:") return false;
    return allowedHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

// ─── Signature Verification (SEC-11) ────────────────────────────────────────

async function verifyWebhookSignature(
  req: NextRequest
): Promise<{ valid: boolean; body?: PaymentWebhookEvent }> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  const certUrl = req.headers.get("x-webhook-cert-url");

  if (!signature) {
    logger.warn("Webhook missing signature header");
    return { valid: false };
  }

  // SEC-15: SSRF prevention — validate cert URL against allowlist before fetching
  if (certUrl && !isValidWebhookCertUrl(certUrl, ALLOWED_WEBHOOK_HOSTS)) {
    logger.warn({ certUrl }, "Webhook cert URL failed SSRF allowlist check");
    return { valid: false };
  }

  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("PAYMENT_WEBHOOK_SECRET is not configured");
    return { valid: false };
  }

  // Compute HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );
  const expectedSig =
    "sha256=" +
    Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  // Constant-time comparison to prevent timing attacks
  if (
    expectedSig.length !== signature.length ||
    !crypto.subtle ||
    !(await timingSafeEqual(expectedSig, signature))
  ) {
    logger.warn({ signature }, "Invalid webhook signature");
    return { valid: false };
  }

  // SEC-03: Zod validation of parsed body
  const parsed = PaymentWebhookEventSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) {
    logger.warn({ errors: parsed.error.errors }, "Webhook body failed Zod validation");
    return { valid: false };
  }

  return { valid: true, body: parsed.data };
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}

// ─── Timestamp Validation (SEC-13) ──────────────────────────────────────────

function validateTimestamp(createdUnixSeconds: number): boolean {
  const eventTimeMs = createdUnixSeconds * 1000;
  const age = Date.now() - eventTimeMs;
  if (age > WEBHOOK_MAX_AGE_MS) {
    logger.warn({ createdUnixSeconds, ageMs: age }, "Webhook event too old — possible replay");
    return false;
  }
  return true;
}

// ─── Idempotency / Replay Prevention (SEC-12) ───────────────────────────────

async function acquireWebhookLock(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookEvent.findUnique({
    where: { externalId: eventId },
  });

  if (existing) {
    logger.info({ eventId }, "Webhook already processed — skipping (idempotent)");
    return false;
  }

  await prisma.webhookEvent.create({
    data: {
      externalId: eventId,
      status: "processing",
    },
  });

  return true;
}

// ─── Subscription Update ─────────────────────────────────────────────────────

async function updateSubscription(event: PaymentWebhookEvent): Promise<void> {
  const { object } = event.data;
  const customerId = object.customer;

  const user = await prisma.user.findUnique({
    where: { paymentCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    logger.warn({ customerId }, "No user found for payment customer ID");
    await prisma.webhookEvent.update({
      where: { externalId: event.id },
      data: { status: "ignored" },
    });
    return;
  }

  switch (event.type) {
    case "payment_intent.succeeded":
    case "invoice.payment_succeeded": {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          status: "active",
          externalId: object.subscription ?? object.id,
          currentPeriodStart: new Date(),
        },
        update: {
          status: "active",
        },
      });
      logger.info({ userId: user.id, eventId: event.id }, "Subscription activated");
      break;
    }

    case "payment_intent.payment_failed":
    case "invoice.payment_failed": {
      await prisma.subscription.updateMany({
        where: { userId: user.id },
        data: { status: "past_due" },
      });
      logger.info({ userId: user.id, eventId: event.id }, "Subscription marked past_due");
      break;
    }

    case "customer.subscription.deleted": {
      await prisma.subscription.updateMany({
        where: { userId: user.id },
        data: { status: "canceled" },
      });
      logger.info({ userId: user.id, eventId: event.id }, "Subscription canceled");
      break;
    }

    default:
      logger.info({ eventType: event.type, eventId: event.id }, "Unhandled webhook event type");
  }

  await prisma.webhookEvent.update({
    where: { externalId: event.id },
    data: { status: "completed" },
  });
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // SEC-06: Origin check — only accept requests from allowed payment provider
  const origin = req.headers.get("origin");
  const userAgent = req.headers.get("user-agent") ?? "";
  if (origin !== null) {
    // Webhooks from payment providers are server-to-server; they must not carry a browser Origin
    logger.warn({ origin }, "Webhook request included Origin header — likely not a server request");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // SEC-11: Verify signature and parse body
  const { valid, body } = await verifyWebhookSignature(req);
  if (!valid || !body) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SEC-13: Reject stale events
  if (!validateTimestamp(body.created)) {
    return NextResponse.json({ error: "Event too old" }, { status: 400 });
  }

  // SEC-12: Idempotency — skip already-processed events
  const acquired = await acquireWebhookLock(body.id);
  if (!acquired) {
    // Return 200 so the provider does not retry
    return NextResponse.json({ received: true });
  }

  try {
    await updateSubscription(body);
  } catch (err) {
    // SEC-17: Never leak stack traces in responses
    logger.error({ eventId: body.id, err }, "Failed to process webhook event");
    await prisma.webhookEvent.update({
      where: { externalId: body.id },
      data: { status: "failed" },
    }).catch(() => {/* best-effort */});

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
