export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // nova funcionalidade
        "fix", // correção de bug
        "chore", // configuração, dependências
        "docs", // documentação
        "refactor", // melhoria sem mudar comportamento
        "test", // testes
        "style", // formatação
        "db", // migrations e banco (personalizado!)
      ],
    ],
    "scope-empty": [2, "never"], // escopo obrigatório
    "subject-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 72],
  },
};
