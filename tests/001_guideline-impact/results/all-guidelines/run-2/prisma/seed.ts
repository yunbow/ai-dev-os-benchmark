import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("Password123!", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      password,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      password,
    },
  });

  const workCategory = await prisma.category.upsert({
    where: { id: "seed-category-work" },
    update: {},
    create: {
      id: "seed-category-work",
      name: "Work",
      color: "#3B82F6",
      userId: alice.id,
    },
  });

  const personalCategory = await prisma.category.upsert({
    where: { id: "seed-category-personal" },
    update: {},
    create: {
      id: "seed-category-personal",
      name: "Personal",
      color: "#10B981",
      userId: alice.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Review project proposal",
        description: "Review and provide feedback on the Q2 project proposal.",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        creatorId: alice.id,
        assigneeId: alice.id,
        categoryId: workCategory.id,
      },
      {
        title: "Set up CI/CD pipeline",
        description: "Configure GitHub Actions for automated testing and deployment.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        creatorId: alice.id,
        assigneeId: bob.id,
        categoryId: workCategory.id,
      },
      {
        title: "Write unit tests",
        description: "Add test coverage for the authentication module.",
        status: "TODO",
        priority: "MEDIUM",
        creatorId: alice.id,
        categoryId: workCategory.id,
      },
      {
        title: "Buy groceries",
        description: "Milk, eggs, bread, and vegetables.",
        status: "TODO",
        priority: "LOW",
        creatorId: alice.id,
        categoryId: personalCategory.id,
      },
      {
        title: "Update documentation",
        description: "Update the API documentation with new endpoints.",
        status: "DONE",
        priority: "MEDIUM",
        creatorId: bob.id,
        assigneeId: bob.id,
        categoryId: workCategory.id,
      },
    ],
    skipDuplicates: true,
  });

  const team = await prisma.team.upsert({
    where: { id: "seed-team-engineering" },
    update: {},
    create: {
      id: "seed-team-engineering",
      name: "Engineering",
      ownerId: alice.id,
    },
  });

  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: alice.id, teamId: team.id } },
    update: {},
    create: { userId: alice.id, teamId: team.id, role: "OWNER" },
  });

  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: bob.id, teamId: team.id } },
    update: {},
    create: { userId: bob.id, teamId: team.id, role: "MEMBER" },
  });

  console.log("Seeding complete!");
  console.log("Test users:");
  console.log("  alice@example.com / Password123!");
  console.log("  bob@example.com / Password123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
