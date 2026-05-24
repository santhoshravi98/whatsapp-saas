import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests only — anything that touches Supabase / QStash / Anthropic
 * lives in the operational scripts and is exercised by `pnpm check:config`.
 *
 * Tests import from `@/...` via the same alias as the app.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
