import { cleanupTestData } from "./testData";

export default async function globalTeardown() {
  if (process.env.E2E_KEEP_DATA) {
    console.log("[e2e] E2E_KEEP_DATA set, leaving test accounts in place");
    return;
  }
  const removed = await cleanupTestData();
  console.log(
    `[e2e] Cleaned up ${removed.users} test users and ${removed.subscribers} alert subscribers`,
  );
}
