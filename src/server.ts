import fastify from "fastify";
import { env } from "./env";

const app = fastify();

import { knex } from "./database";

app.get("/hello", async () => {
  const tables = await knex("sqlite_schema").select("name");
  return tables;
});

app
  .listen({ port: env.PORT })
  .then(() => console.log(`🚀 http://localhost:${env.PORT}`));
