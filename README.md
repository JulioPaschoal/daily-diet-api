# 🥗 Daily Diet API

API para controle de dieta diária. Cada usuário registra as refeições que fez, informa se estavam dentro ou fora da dieta e acompanha as próprias métricas, incluindo a melhor sequência de refeições dentro da dieta.

## 🧰 Tecnologias

- [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Fastify](https://fastify.dev/) (servidor HTTP) + [@fastify/cookie](https://github.com/fastify/fastify-cookie)
- [Knex](https://knexjs.org/) (query builder e migrations) + [SQLite](https://www.sqlite.org/)
- [Zod](https://zod.dev/) (validação de dados e de variáveis de ambiente)
- [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest) (testes e2e)
- [pnpm](https://pnpm.io/), [commitlint](https://commitlint.js.org/) e [husky](https://typicode.github.io/husky/)

## 🚀 Como rodar

```bash
# 1. Instalar as dependências
pnpm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env

# 3. Criar as tabelas no banco
pnpm knex migrate:latest

# 4. Subir o servidor em modo de desenvolvimento
pnpm dev
```

A API fica disponível em `http://localhost:3333`.

### Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `NODE_ENV` | `development`, `test` ou `production` | `production` |
| `DATABASE_URL` | Caminho do arquivo do banco SQLite | obrigatória |
| `PORT` | Porta do servidor | `3333` |

## 🧪 Testes

```bash
pnpm test        # roda todos os testes uma vez
pnpm test:watch  # roda os testes a cada alteração
```

Os testes usam o `.env.test`, que aponta para um banco separado (`db/test.db`). O banco é recriado antes de cada teste. Os testes também rodam automaticamente antes de cada commit (husky `pre-commit`).

## 🔐 Como o usuário é identificado

Ao criar o usuário (`POST /users`), a API gera um `sessionId` aleatório (UUID) e o envia num cookie `httpOnly`, válido por 7 dias. Nas próximas requisições, o cookie é enviado automaticamente, e o middleware `checkSessionIdExists` encontra o usuário dono daquele `sessionId`.

Sem cookie, ou com um cookie inválido, as rotas de refeições respondem `401`.

## 🛣️ Rotas

### Usuários

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| `POST` | `/users` | Cria um usuário e devolve o cookie `sessionId` | `201`, `400`, `409` (e-mail já cadastrado) |

```json
{ "name": "Ana", "email": "ana@email.com" }
```

### Refeições (precisam do cookie `sessionId`)

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| `POST` | `/meals` | Registra uma refeição | `201`, `400`, `401` |
| `GET` | `/meals` | Lista as refeições do usuário (mais recentes primeiro) | `200`, `401` |
| `GET` | `/meals/:id` | Mostra uma refeição | `200`, `400`, `401`, `404` |
| `PUT` | `/meals/:id` | Edita todos os dados de uma refeição | `204`, `400`, `401`, `404` |
| `DELETE` | `/meals/:id` | Apaga uma refeição | `204`, `400`, `401`, `404` |
| `GET` | `/meals/metrics` | Métricas do usuário | `200`, `401` |

Corpo do `POST` e do `PUT`:

```json
{
  "name": "Almoço",
  "description": "Arroz, feijão e frango",
  "date": "2026-11-20T12:30:00-03:00",
  "isOnDiet": true
}
```

Resposta de `GET /meals/metrics`:

```json
{
  "totalMeals": 7,
  "totalMealsOnDiet": 5,
  "totalMealsOffDiet": 2,
  "bestOnDietSequence": 3
}
```

## ✅ Regras da aplicação

- [x] Deve ser possível criar um usuário
- [x] Deve ser possível identificar o usuário entre as requisições
- [x] Deve ser possível registrar uma refeição (nome, descrição, data e hora, dentro ou fora da dieta), relacionada a um usuário
- [x] Deve ser possível editar uma refeição, podendo alterar todos os dados
- [x] Deve ser possível apagar uma refeição
- [x] Deve ser possível listar todas as refeições de um usuário
- [x] Deve ser possível visualizar uma única refeição
- [x] Deve ser possível recuperar as métricas de um usuário (total, dentro da dieta, fora da dieta e melhor sequência dentro da dieta)
- [x] O usuário só pode visualizar, editar e apagar as refeições que ele criou (refeições de outro usuário respondem `404`)

## 📝 Padrão de commits

Os commits seguem o formato `tipo(escopo): descrição em minúsculas`, validado pelo commitlint.

Tipos aceitos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style` e `db` (migrations e banco).
