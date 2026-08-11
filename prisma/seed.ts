import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Demo login user ---
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@mpcircle.org" },
    update: {},
    create: {
      email: "admin@mpcircle.org",
      password: passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  // --- Demo course ---
  const course = await prisma.course.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Intro to Backend Engineering",
      description: "REST APIs, databases, and backend fundamentals.",
      credits: 4,
    },
  });

  // --- Demo student ---
  const student = await prisma.student.upsert({
    where: { email: "safwen@example.com" },
    update: {},
    create: {
      firstName: "Safwen",
      lastName: "Student",
      email: "safwen@example.com",
    },
  });

  // --- Demo assignment ---
  const existingAssignment = await prisma.assignment.findFirst({
    where: {
      studentId: student.id,
      courseId: course.id,
      title: "Build a REST API",
    },
  });

  if (!existingAssignment) {
    await prisma.assignment.create({
      data: {
        title: "Build a REST API",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        studentId: student.id,
        courseId: course.id,
        status: "PENDING",
      },
    });
  }

  console.log("✅ Seed complete. Login with:");
  console.log(`   email: ${user.email}`);
  console.log("   password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
