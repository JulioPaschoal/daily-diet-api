import cookie from "@fastify/cookie";
import fastify from "fastify";
import z, { ZodError } from "zod";
import { usersRoutes } from "./routes/users";

export const app = fastify();

app.register(cookie);
app.register(usersRoutes, { prefix: "users" });

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Dados inválidos.",
      issues: z.treeifyError(error),
    });
  }

  console.error(error);
  return reply.status(500).send({ message: "Erro interno do servidor." });
});
