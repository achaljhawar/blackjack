import { type Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.SUPABASE_DATABASE_URL,
  },
  tablesFilter: ["blackjack_*"],
} satisfies Config;
