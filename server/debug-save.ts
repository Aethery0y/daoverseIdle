
import { db } from "./db";
import { users, saves } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

async function checkSaves() {
    console.log("Checking latest saves...");

    const latestSaves = await db.select({
        userId: saves.userId,
        username: users.username,
        data: saves.data,
        updatedAt: saves.updatedAt
    })
        .from(saves)
        .leftJoin(users, eq(saves.userId, users.id))
        .orderBy(desc(saves.updatedAt))
        .limit(5);

    latestSaves.forEach(s => {
        console.log(`\nUser: ${s.username} (ID: ${s.userId})`);
        console.log(`Updated: ${s.updatedAt}`);
        // @ts-ignore
        console.log(`Faction in DB:`, s.data?.faction);
        // @ts-ignore
        console.log(`Realm: ${s.data?.realm?.name} (ID: ${s.data?.realm?.id})`);
    });

    process.exit(0);
}

checkSaves().catch(console.error);
