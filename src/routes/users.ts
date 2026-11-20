import { randomUUID } from "node:crypto";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";

export async function usersRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string().min(1),
      email: z.email(),
    });

    const { name, email } = createUserBodySchema.parse(request.body);

    const userWithSameEmail = await knex("users").where({ email }).first();

    if (userWithSameEmail) {
      return reply.status(409).send({ message: "E-mail já cadastrado." });
    }

    const sessionId = randomUUID();

    await knex("users").insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      email,
    });

    reply.setCookie("sessionId", sessionId, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return reply.status(201).send();
  });
}
