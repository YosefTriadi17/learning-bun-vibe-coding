import { migrate } from "drizzle-orm/mysql2/migrator";
import { db, connectionParams } from "./connection";
import mysql from "mysql2/promise";

async function main() {
  console.log("⏳ Initializing database...");
  
  // 1. Create database if it doesn't exist
  const connection = await mysql.createConnection({
    host: connectionParams.host,
    port: connectionParams.port,
    user: connectionParams.user,
    password: connectionParams.password,
  });
  
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${connectionParams.database}\`;`);
  console.log(`✅ Database "${connectionParams.database}" ensured.`);
  await connection.end();
  
  // 2. Run Drizzle Migrations
  console.log("⏳ Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✅ Migrations completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
