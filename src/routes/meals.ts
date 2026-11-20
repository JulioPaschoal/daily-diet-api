import { randomUUID } from "node:crypto";
import { FastifyInstance } from "fastify";
import { Tables } from "knex/types/tables";
import { z } from "zod";
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

// O mesmo "molde" serve para criar e para editar uma refeição.
const mealBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  date: z.coerce.date(),
  isOnDiet: z.boolean(),
});

const mealParamsSchema = z.object({
  id: z.uuid(),
});

// Traduz a linha do banco (snake_case, 1/0) para o JSON da API (camelCase, true/false).
// O user_id fica de fora: quem pediu já sabe que a refeição é dele.
function formatMeal(meal: Tables["meals"]) {
  return {
    id: meal.id,
    name: meal.name,
    description: meal.description,
    date: meal.date,
    isOnDiet: Boolean(meal.is_on_diet),
    createdAt: meal.created_at,
    updatedAt: meal.updated_at,
  };
}

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", checkSessionIdExists);

  app.post("/", async (request, reply) => {
    const { name, description, date, isOnDiet } = mealBodySchema.parse(
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

  app.get("/", async (request) => {
    const user = request.user!;

    const meals = await knex("meals")
      .where({ user_id: user.id })
      .orderBy("date", "desc");

    return { meals: meals.map(formatMeal) };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = mealParamsSchema.parse(request.params);
    const user = request.user!;

    // Filtra por id E por user_id: refeição de outra pessoa = "não existe".
    const meal = await knex("meals").where({ id, user_id: user.id }).first();

    if (!meal) {
      return reply.status(404).send({ message: "Refeição não encontrada." });
    }

    return { meal: formatMeal(meal) };
  });

  app.put("/:id", async (request, reply) => {
    const { id } = mealParamsSchema.parse(request.params);
    const { name, description, date, isOnDiet } = mealBodySchema.parse(
      request.body,
    );
    const user = request.user!;

    const updatedRows = await knex("meals")
      .where({ id, user_id: user.id })
      .update({
        name,
        description,
        date: date.toISOString(),
        is_on_diet: isOnDiet,
        updated_at: knex.fn.now(),
      });

    if (updatedRows === 0) {
      return reply.status(404).send({ message: "Refeição não encontrada." });
    }

    return reply.status(204).send();
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = mealParamsSchema.parse(request.params);
    const user = request.user!;

    const deletedRows = await knex("meals")
      .where({ id, user_id: user.id })
      .delete();

    if (deletedRows === 0) {
      return reply.status(404).send({ message: "Refeição não encontrada." });
    }

    return reply.status(204).send();
  });
}
