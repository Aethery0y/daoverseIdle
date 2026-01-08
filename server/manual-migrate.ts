import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting manual migration...");

  try {
    // 1. Update users table avatar column
    console.log("Modifying users.avatar to LONGTEXT...");
    await db.execute(sql`ALTER TABLE users MODIFY COLUMN avatar LONGTEXT`);

    // 2. Create friendships table
    console.log("Creating friendships table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS friendships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create notifications table
    console.log("Creating notifications table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        \`read\` BOOLEAN NOT NULL DEFAULT FALSE,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Add ranking columns to users
    console.log("Adding ranking columns to users...");
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN total_qi BIGINT DEFAULT 0`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN qi_per_tap BIGINT DEFAULT 0`);
    } catch (e: any) {
      console.log("Columns might already exist, skipping...", e.message);
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
