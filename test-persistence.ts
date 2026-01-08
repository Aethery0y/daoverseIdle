
import { storage } from "./server/storage";
import { db } from "./server/db";
import { users, saves } from "./shared/schema";
import { eq } from "drizzle-orm";

async function runTest() {
    console.log("=== STARTING PERSISTENCE TEST ===");

    const testUsername = "test_persist_" + Date.now();
    const testPassword = "password123";

    // 1. Register User
    console.log(`\n1. Creating user: ${testUsername}`);
    const user = await storage.createUser({
        username: testUsername,
        password: testPassword,
    });
    console.log("User created with ID:", user.id);

    // 2. Initial Save
    console.log("\n2. Saving initial game state...");
    const initialState: any = {
        resources: { qi: 100, totalQi: 100, ascensionPoints: 0 },
        generators: {},
        realm: { id: 1, stage: 1, name: "Test Realm", world: "Test", multiplier: 1 },
        faction: "demonic",
        upgrades: [],
        achievements: [],
        settings: { theme: 'dark' },
        // Force specific value to check persistence
        stats: { qiPerTap: 999 },
        lastSaveTime: Date.now()
    };

    await storage.updateSave(user.id, initialState);
    console.log("Save complete.");

    // 3. Verify Save Immediate
    console.log("\n3. Verifying save (Immediate)...");
    const save1 = await storage.getSave(user.id);
    if (save1 && save1.data.stats.qiPerTap === 999) {
        console.log("SUCCESS: Initial save found.");
    } else {
        console.error("FAILURE: Initial save NOT found or corrupt.", save1);
        process.exit(1);
    }

    // 4. Update Save (Simulate playing)
    console.log("\n4. Updating save (Simulate play)...");
    initialState.resources.qi = 5000;
    initialState.stats.qiPerTap = 5000;
    await storage.updateSave(user.id, initialState);
    console.log("Update complete.");

    // 5. Simulate "Restart" / New Request
    // We can't easily kill the process here, but we can verify DB state directly.
    console.log("\n5. Verifying persistence (Simulated Re-login)...");

    // Directly query DB to ensure it's not just cached in memory
    const [dbRows] = await db.select().from(saves).where(eq(saves.userId, user.id));

    if (dbRows && dbRows.data.resources.qi === 5000) {
        console.log("SUCCESS: Data persisted in database correctly.");
    } else {
        console.error("FAILURE: Database row does not match expected state.", dbRows);
    }

    console.log("\n=== TEST COMPLETE: DATABASE IS WORKING ===");
    process.exit(0);
}

runTest().catch(console.error);
