import { randomUUID } from "node:crypto";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", checkSessionIdExists);

  app.post("/", async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      date: z.coerce.date(),
      isOnDiet: z.boolean(),
    });

    const { name, description, date, isOnDiet } = createMealBodySchema.parse(
      request.body,
    );

    const user = request.user!;

    await knex("meals").insert({
      id: randomUUID(),
      user_id: user.id,
      name,
      description,
      date: date.toISOString(),
      is_on_diet: isOnDiet,
    });

    return reply.status(201).send();
  });
}
