import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "backend/src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      // Sonar's own sonar.coverage.exclusions (sonar-project.properties) is what actually
      // keeps framework/config/E2E-tested files out of the displayed coverage % -- this
      // just needs to not crash on files v8 never loaded (untested backend modules report
      // 0%, which Sonar then ignores for the ones it's told to exclude).
      include: ["src/**/*.ts", "src/**/*.tsx", "backend/src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "backend/src/**/*.test.ts", "src/main.tsx", "src/vite-env.d.ts"],
    },
  },
});
