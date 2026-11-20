import { execSync } from "node:child_process";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("Users routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // Cada teste começa com o banco de testes zerado.
  beforeEach(() => {
    execSync("pnpm knex migrate:rollback --all");
    execSync("pnpm knex migrate:latest");
  });

  it("should be able to create a new user", async () => {
    const response = await request(app.server)
      .post("/users")
      .send({ name: "Ana", email: "ana@email.com" })
      .expect(201);

    const cookies = response.get("Set-Cookie");

    expect(cookies).toEqual(
      expect.arrayContaining([expect.stringContaining("sessionId=")]),
    );
  });

  it("should not be able to create two users with the same email", async () => {
    await request(app.server)
      .post("/users")
      .send({ name: "Ana", email: "ana@email.com" })
      .expect(201);

    await request(app.server)
      .post("/users")
      .send({ name: "Outra Ana", email: "ana@email.com" })
      .expect(409);
  });

  it("should not be able to create a user with invalid data", async () => {
    await request(app.server)
      .post("/users")
      .send({ name: "", email: "nao-e-email" })
      .expect(400);
  });
});
