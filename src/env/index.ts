import { config } from "dotenv";
import { z } from "zod";

// O Vitest define NODE_ENV=test sozinho. Nos testes lemos o .env.test,
// que aponta para outro banco; assim os testes nunca mexem no app.db.
if (process.env.NODE_ENV === "test") {
  config({ path: ".env.test", quiet: true });
} else {
  config({ quiet: true });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3333),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("⚠️ Variáveis de ambiente inválidas!");
  console.error(z.prettifyError(_env.error));

  throw new Error("Invalid environment variables.");
}

export const env = _env.data;
