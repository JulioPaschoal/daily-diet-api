import "fastify";
import { Tables } from "knex/types/tables";

declare module "fastify" {
  export interface FastifyRequest {
    user?: Tables["users"];
  }
}
