import assert from "node:assert/strict";
import test from "node:test";
import { orderByFeaturedThenNewest } from "./sort";

const crawl = "2026-10-27T10:00:00.000Z";
const older = "2026-10-20T10:00:00.000Z";

test("keeps a newer listing ahead of an older one", () => {
  const ordered = orderByFeaturedThenNewest([
    { id: "old", company_id: "duke", scraped_at: older },
    { id: "new", company_id: "duke", scraped_at: crawl },
  ]);
  assert.deepEqual(
    ordered.map((job) => job.id),
    ["new", "old"],
  );
});

test("round-robins companies that share a crawl timestamp", () => {
  const ordered = orderByFeaturedThenNewest([
    { id: "d1", company_id: "duke", scraped_at: crawl },
    { id: "d2", company_id: "duke", scraped_at: crawl },
    { id: "d3", company_id: "duke", scraped_at: crawl },
    { id: "a1", company_id: "ameren", scraped_at: crawl },
    { id: "c1", company_id: "constellation", scraped_at: crawl },
    { id: "old", company_id: "duke", scraped_at: older },
  ]);
  assert.deepEqual(
    ordered.map((job) => job.id),
    ["d1", "a1", "c1", "d2", "d3", "old"],
  );
});

test("keeps a live featured listing above a newer unfeatured one", () => {
  const ordered = orderByFeaturedThenNewest(
    [
      { id: "fresh", company_id: "duke", scraped_at: crawl },
      {
        id: "paid",
        company_id: "ameren",
        scraped_at: older,
        is_featured: true,
        featured_until: "2027-01-01T00:00:00.000Z",
      },
    ],
    new Date("2026-10-27T12:00:00.000Z"),
  );
  assert.deepEqual(
    ordered.map((job) => job.id),
    ["paid", "fresh"],
  );
});
