import assert from "node:assert/strict";
import test from "node:test";
import { assessClaimRisk } from "../src/utils/riskAssessment.js";

test("detects all required flags and high risk", () => {
  const result = assessClaimRisk(
    "BREAKING: THIS IS SHOCKING. SHARE BEFORE DELETED.",
  );

  assert.deepEqual(result.riskFlags, ["SENSATIONAL", "SHOUTING", "UNSOURCED"]);
  assert.equal(result.riskLevel, "HIGH");
});

test("does not treat exactly half uppercase characters as shouting", () => {
  const result = assessClaimRisk("ABcd");

  assert.deepEqual(result.riskFlags, ["UNSOURCED"]);
  assert.equal(result.riskLevel, "MEDIUM");
});

test("does not flag a claim as unsourced when it includes a source URL", () => {
  const result = assessClaimRisk(
    "The report is available at https://example.org/report.",
  );

  assert.deepEqual(result.riskFlags, []);
  assert.equal(result.riskLevel, "LOW");
});
