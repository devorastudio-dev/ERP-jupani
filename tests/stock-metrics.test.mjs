import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCoverageDays,
  calculateReplenishmentGap,
  calculateTurnover,
} from "../src/lib/stock-metrics.js";

test("calculateCoverageDays returns null when there is no sale history", () => {
  assert.equal(calculateCoverageDays(0, 10, 30), null);
});

test("calculateCoverageDays estimates coverage from stock and period consumption", () => {
  assert.equal(calculateCoverageDays(30, 15, 30), 15);
});

test("calculateTurnover returns inventory turnover ratio", () => {
  assert.equal(calculateTurnover(20, 10), 2);
});

test("calculateReplenishmentGap never returns negative values", () => {
  assert.equal(calculateReplenishmentGap(12, 10), 0);
  assert.equal(calculateReplenishmentGap(4, 10), 6);
});
