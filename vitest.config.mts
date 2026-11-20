import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Todos os arquivos de teste usam o mesmo db/test.db.
    // Rodar um arquivo por vez evita que um teste apague os dados do outro.
    fileParallelism: false,
  },
});
