import { execSync } from "node:child_process";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";

// Cria um usuário e devolve o cookie (a "pulseirinha") dele.
async function createUserAndGetCookies(email = "ana@email.com") {
  const response = await request(app.server)
    .post("/users")
    .send({ name: "Ana", email })
    .expect(201);

  return response.get("Set-Cookie") ?? [];
}

async function createMeal(
  cookies: string[],
  overrides: Partial<{ name: string; date: string; isOnDiet: boolean }> = {},
) {
  await request(app.server)
    .post("/meals")
    .set("Cookie", cookies)
    .send({
      name: "Almoço",
      description: "Arroz, feijão e frango",
      date: "2026-11-20T12:30:00.000Z",
      isOnDiet: true,
      ...overrides,
    })
    .expect(201);
}

async function getFirstMealId(cookies: string[]) {
  const response = await request(app.server)
    .get("/meals")
    .set("Cookie", cookies)
    .expect(200);

  return response.body.meals[0].id as string;
}

describe("Meals routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("pnpm knex migrate:rollback --all");
    execSync("pnpm knex migrate:latest");
  });

  it("should be able to create a meal", async () => {
    const cookies = await createUserAndGetCookies();

    await createMeal(cookies);
  });

  it("should not be able to access meals without a session", async () => {
    await request(app.server).get("/meals").expect(401);

    await request(app.server)
      .get("/meals")
      .set("Cookie", ["sessionId=cookie-falso"])
      .expect(401);
  });

  it("should not be able to create a meal with invalid data", async () => {
    const cookies = await createUserAndGetCookies();

    await request(app.server)
      .post("/meals")
      .set("Cookie", cookies)
      .send({ name: "Almoço", date: "banana", isOnDiet: "sim" })
      .expect(400);
  });

  it("should be able to list only the user's own meals", async () => {
    const anaCookies = await createUserAndGetCookies("ana@email.com");
    const biaCookies = await createUserAndGetCookies("bia@email.com");

    await createMeal(anaCookies, { name: "Café da manhã" });
    await createMeal(biaCookies, { name: "Refeição da Bia" });

    const response = await request(app.server)
      .get("/meals")
      .set("Cookie", anaCookies)
      .expect(200);

    expect(response.body.meals).toEqual([
      expect.objectContaining({
        name: "Café da manhã",
        description: "Arroz, feijão e frango",
        date: "2026-11-20T12:30:00.000Z",
        isOnDiet: true,
      }),
    ]);
  });

  it("should be able to get a specific meal", async () => {
    const cookies = await createUserAndGetCookies();
    await createMeal(cookies);
    const mealId = await getFirstMealId(cookies);

    const response = await request(app.server)
      .get(`/meals/${mealId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(response.body.meal).toEqual(
      expect.objectContaining({ id: mealId, name: "Almoço", isOnDiet: true }),
    );
  });

  it("should be able to edit a meal", async () => {
    const cookies = await createUserAndGetCookies();
    await createMeal(cookies);
    const mealId = await getFirstMealId(cookies);

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set("Cookie", cookies)
      .send({
        name: "Jantar",
        description: "Pizza",
        date: "2026-11-20T21:00:00.000Z",
        isOnDiet: false,
      })
      .expect(204);

    const response = await request(app.server)
      .get(`/meals/${mealId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(response.body.meal).toEqual(
      expect.objectContaining({
        name: "Jantar",
        description: "Pizza",
        date: "2026-11-20T21:00:00.000Z",
        isOnDiet: false,
      }),
    );
  });

  it("should be able to delete a meal", async () => {
    const cookies = await createUserAndGetCookies();
    await createMeal(cookies);
    const mealId = await getFirstMealId(cookies);

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set("Cookie", cookies)
      .expect(204);

    await request(app.server)
      .get(`/meals/${mealId}`)
      .set("Cookie", cookies)
      .expect(404);
  });

  it("should not be able to see, edit or delete another user's meal", async () => {
    const anaCookies = await createUserAndGetCookies("ana@email.com");
    const biaCookies = await createUserAndGetCookies("bia@email.com");

    await createMeal(anaCookies);
    const anaMealId = await getFirstMealId(anaCookies);

    await request(app.server)
      .get(`/meals/${anaMealId}`)
      .set("Cookie", biaCookies)
      .expect(404);

    await request(app.server)
      .put(`/meals/${anaMealId}`)
      .set("Cookie", biaCookies)
      .send({
        name: "Hackeado",
        description: "Hackeado",
        date: "2026-11-20T21:00:00.000Z",
        isOnDiet: false,
      })
      .expect(404);

    await request(app.server)
      .delete(`/meals/${anaMealId}`)
      .set("Cookie", biaCookies)
      .expect(404);

    // A refeição da Ana continua lá, sem nenhuma alteração.
    const response = await request(app.server)
      .get(`/meals/${anaMealId}`)
      .set("Cookie", anaCookies)
      .expect(200);

    expect(response.body.meal.name).toBe("Almoço");
  });

  it("should be able to get the user's metrics", async () => {
    const cookies = await createUserAndGetCookies();

    // Cadastradas fora de ordem de propósito. Em ordem de data fica:
    // dia 01 ✅, 02 ✅, 03 ❌, 04 ✅, 05 ✅, 06 ✅, 07 ❌ → melhor sequência = 3
    const meals = [
      { date: "2026-11-05T12:00:00.000Z", isOnDiet: true },
      { date: "2026-11-01T12:00:00.000Z", isOnDiet: true },
      { date: "2026-11-03T12:00:00.000Z", isOnDiet: false },
      { date: "2026-11-02T12:00:00.000Z", isOnDiet: true },
      { date: "2026-11-04T12:00:00.000Z", isOnDiet: true },
      { date: "2026-11-06T12:00:00.000Z", isOnDiet: true },
      { date: "2026-11-07T12:00:00.000Z", isOnDiet: false },
    ];

    for (const meal of meals) {
      await createMeal(cookies, meal);
    }

    const response = await request(app.server)
      .get("/meals/metrics")
      .set("Cookie", cookies)
      .expect(200);

    expect(response.body).toEqual({
      totalMeals: 7,
      totalMealsOnDiet: 5,
      totalMealsOffDiet: 2,
      bestOnDietSequence: 3,
    });
  });
});
