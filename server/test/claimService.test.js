import assert from "node:assert/strict";
import test from "node:test";
import {
  createClaim,
  getClaims,
  getClaimById,
  reviewClaim,
  agreeToClaim,
  unagreeToClaim,
} from "../src/services/claimService.js";

test("DP1: orders claims by risk level (HIGH > MEDIUM > LOW), then recency", async () => {
  const claims = await getClaims();
  assert.ok(claims.length >= 3);

  // Check that no MEDIUM appears before HIGH, and no LOW appears before MEDIUM or HIGH
  const riskRanks = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  for (let i = 0; i < claims.length - 1; i++) {
    const currentWeight = riskRanks[claims[i].riskLevel];
    const nextWeight = riskRanks[claims[i + 1].riskLevel];
    assert.ok(
      currentWeight >= nextWeight,
      `Claim at index ${i} (${claims[i].riskLevel}) should have risk weight >= index ${i + 1} (${claims[i + 1].riskLevel})`,
    );

    if (currentWeight === nextWeight) {
      assert.ok(
        new Date(claims[i].createdAt).getTime() >= new Date(claims[i + 1].createdAt).getTime(),
        "Within same risk level, newer claims must appear first",
      );
    }
  }
});

test("filtering by category and status works", async () => {
  const financeClaims = await getClaims({ category: "Finance" });
  assert.ok(financeClaims.every((c) => c.category === "Finance"));

  const unverifiedClaims = await getClaims({ status: "UNVERIFIED" });
  assert.ok(unverifiedClaims.every((c) => c.status === "UNVERIFIED"));
});

test("DP3: reviewing a claim updates status and note, but preserves original text", async () => {
  const newClaim = await createClaim({
    text: "Original immutable text for review test",
    sourcePlatform: "WhatsApp",
    category: "Politics",
    riskFlags: ["UNSOURCED"],
    riskLevel: "MEDIUM",
  });

  const reviewed = await reviewClaim(newClaim.id, {
    status: "VERIFIED_TRUE",
    reviewerNote: "Confirmed with official record",
  });

  assert.equal(reviewed.status, "VERIFIED_TRUE");
  assert.equal(reviewed.reviewerNote, "Confirmed with official record");
  assert.equal(reviewed.text, "Original immutable text for review test");
  assert.ok(reviewed.reviewedAt !== null);

  // Verify fetch by ID also reflects changes
  const fetched = await getClaimById(newClaim.id);
  assert.equal(fetched.status, "VERIFIED_TRUE");
  assert.equal(fetched.text, "Original immutable text for review test");
});

test("community agreement count increments and decrements safely", async () => {
  const claim = await createClaim({
    text: "Claim testing community agree counts",
    sourcePlatform: "X",
    category: "Health",
    riskFlags: [],
    riskLevel: "LOW",
  });

  const initialCount = claim.agreeCount;
  const agreed = await agreeToClaim(claim.id);
  assert.equal(agreed.agreeCount, initialCount + 1);

  const unagreed = await unagreeToClaim(claim.id);
  assert.equal(unagreed.agreeCount, initialCount);
});
