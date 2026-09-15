import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "next/server": path.resolve(__dirname, "node_modules/next/server.js"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET: "test-secret",
      AUTH_DEV_PASSWORD: "dev",
      AUTH_ADMIN_EMAILS: "admin@nexashop.dev",
    },
    server: {
      deps: {
        inline: ["next-auth"],
      },
    },
  },
});