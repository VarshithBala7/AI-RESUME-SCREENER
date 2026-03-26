import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const sqliteUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const sqlitePath = sqliteUrl.startsWith("file:") ? sqliteUrl.replace("file:", "") : sqliteUrl;

const adapter = new PrismaBetterSqlite3({ url: sqlitePath });

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
