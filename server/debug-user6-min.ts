
import { db } from "./db";
import { saves } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkUser6Minimal() {
    const save = await db.select().from(saves).where(eq(saves.userId, 6)).limit(1);
    if (save.length > 0) {
        // @ts-ignore
        console.log(`[DB_FACTION_VALUE]: "${save[0].data?.faction}"`);
    } else {
        console.log("[DB_FACTION_VALUE]: NO_SAVE");
    }
    process.exit(0);
}

checkUser6Minimal();
