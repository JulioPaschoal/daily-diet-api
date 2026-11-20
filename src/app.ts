import cookie from "@fastify/cookie";
import fastify from "fastify";
import { ZodError, z } from "zod";
import { mealsRoutes } from "./routes/meals";
import { usersRoutes } from "./routes/users";

export const app = fastify();

app.register(cookie);
app.register(usersRoutes, { prefix: "users" });
app.register(mealsRoutes, { prefix: "meals" });

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
