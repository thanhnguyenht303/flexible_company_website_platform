import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import prompts from "prompts";
import { syncAuthorities } from "../lib/authority-sync";

const prisma = new PrismaClient();
const minPasswordLength = Number(process.env.PASSWORD_MIN_LENGTH ?? 10);

async function main() {
  if (process.env.ALLOW_ADMIN_BOOTSTRAP !== "true") {
    throw new Error(
      "Admin bootstrap is disabled. Set ALLOW_ADMIN_BOOTSTRAP=true only during initial setup."
    );
  }

  const superAdminRole = await syncAuthorities(prisma);

  const existingAdmin = await prisma.user.findFirst({
    where: { roleId: superAdminRole.id }
  });

  if (existingAdmin) {
    const confirm = await prompts({
      type: "confirm",
      name: "value",
      message: "A Super Admin already exists. Create another one?",
      initial: false
    });

    if (!confirm.value) return;
  }

  const answers = await prompts([
    { type: "text", name: "username", message: "Admin username:" },
    { type: "text", name: "email", message: "Admin email (optional):" },
    { type: "text", name: "displayName", message: "Display name (optional):" },
    { type: "password", name: "password", message: "Admin password:" },
    { type: "password", name: "confirmPassword", message: "Confirm password:" }
  ]);

  if (!answers.username || answers.username.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }

  if (!answers.password || answers.password.length < minPasswordLength) {
    throw new Error(`Password must be at least ${minPasswordLength} characters.`);
  }

  if (!/[A-Z]/.test(answers.password) || !/[a-z]/.test(answers.password) || !/[0-9]/.test(answers.password)) {
    throw new Error("Password must include uppercase, lowercase, and numeric characters.");
  }

  if (answers.password !== answers.confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const passwordHash = await bcrypt.hash(answers.password, 12);

  await prisma.user.create({
    data: {
      username: answers.username,
      email: answers.email || null,
      displayName: answers.displayName || null,
      passwordHash,
      roleId: superAdminRole.id,
      status: "ACTIVE"
    }
  });

  console.log("Super Admin account created successfully.");
  console.log("Important: set ALLOW_ADMIN_BOOTSTRAP=false in production after setup.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
