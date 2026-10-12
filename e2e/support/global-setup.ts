import { cleanupTestData } from "./testData";

export default async function globalSetup() {
  const removed = await cleanupTestData();
  if (removed.users || removed.subscribers) {
    console.log(
      `[e2e] Removed leftovers from a previous run: ${removed.users} users, ${removed.subscribers} alert subscribers`,
    );
  }
}
