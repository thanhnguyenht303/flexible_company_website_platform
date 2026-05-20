import { existsSync, readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import prompts from "prompts";

const envPath = ".env";
const envExamplePath = ".env.example";

function setEnvValue(source: string, key: string, value: string) {
  const escaped = value.includes(" ") || value.includes("#") ? `"${value.replace(/"/g, '\\"')}"` : value;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(source)) return source.replace(pattern, `${key}=${escaped}`);
  return `${source.trimEnd()}\n${key}=${escaped}\n`;
}

async function main() {
  const answers = await prompts([
    {
      type: "text",
      name: "siteUrl",
      message: "Public site URL:",
      initial: "http://localhost:3000"
    },
    {
      type: "text",
      name: "appName",
      message: "Application name:",
      initial: "Flexible Company Website"
    },
    {
      type: "text",
      name: "databaseHost",
      message: "Database host:",
      initial: "localhost"
    },
    {
      type: "text",
      name: "databaseName",
      message: "Database name:",
      initial: "company_website"
    },
    {
      type: "text",
      name: "databaseUser",
      message: "Database user:",
      initial: "company_user"
    },
    {
      type: "password",
      name: "databasePassword",
      message: "Database password:"
    }
  ]);

  const template = existsSync(envPath) ? readFileSync(envPath, "utf8") : readFileSync(envExamplePath, "utf8");
  const databaseUrl = `postgresql://${answers.databaseUser}:${encodeURIComponent(
    answers.databasePassword
  )}@${answers.databaseHost}:5432/${answers.databaseName}?schema=public`;

  let next = template;
  next = setEnvValue(next, "NEXT_PUBLIC_SITE_URL", answers.siteUrl);
  next = setEnvValue(next, "APP_NAME", answers.appName);
  next = setEnvValue(next, "APP_SECRET", randomBytes(32).toString("hex"));
  next = setEnvValue(next, "DATABASE_HOST", answers.databaseHost);
  next = setEnvValue(next, "DATABASE_NAME", answers.databaseName);
  next = setEnvValue(next, "DATABASE_USER", answers.databaseUser);
  next = setEnvValue(next, "DATABASE_PASSWORD", answers.databasePassword);
  next = setEnvValue(next, "DATABASE_URL", databaseUrl);
  next = setEnvValue(next, "ALLOW_ADMIN_BOOTSTRAP", "true");

  writeFileSync(envPath, next);
  console.log(".env written. Run migrations, seed data, then pnpm setup:admin.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
