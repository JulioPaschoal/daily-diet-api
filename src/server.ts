import fastify from "fastify";
import { env } from "./env";

const app = fastify();

app.get("/hello", async () => {
  return { message: "Olá, Daily Diet! 🥗" };
});

app
  .listen({ port: env.PORT })
  .then(() => console.log("🚀 http://localhost:3333"));
