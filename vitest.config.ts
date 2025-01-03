import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.spec.tsx", "**/*.spec.ts"],
    globals: true,
  },
});
