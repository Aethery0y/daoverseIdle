
import { db } from "./db";
import { users, saves } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkUser6() {
    console.log("Checking User 6...");

    const save = await db.select().from(saves).where(eq(saves.userId, 6)).limit(1);

    if (save.length === 0) {
        console.log("User 6 has NO save record.");
    } else {
        const s = save[0];
        console.log(`Updated: ${s.updatedAt}`);
        // @ts-ignore
        console.log(`DATA TYPE: ${typeof s.data}`);
        // @ts-ignore
        console.log(`FACTION: ${s.data?.faction}`);
        // @ts-ignore
        console.log(`Realm ID: ${s.data?.realm?.id}`);
        // @ts-ignore
        console.log(`FULL DATA START:`, JSON.stringify(s.data).substring(0, 200));
    }

    process.exit(0);
}

checkUser6().catch(console.error);
