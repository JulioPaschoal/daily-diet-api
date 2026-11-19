import fastify from "fastify";

const app = fastify();

app.get("/hello", async () => {
  return { message: "Olá, Daily Diet! 🥗" };
});

app.listen({ port: 3333 }).then(() => console.log("🚀 http://localhost:3333"));
