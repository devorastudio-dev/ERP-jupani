import test from "node:test";
import assert from "node:assert/strict";
import {
  areUnitsCompatible,
  convertQuantity,
  convertUnitCost,
  normalizeUnit,
} from "../src/lib/measurement.js";

test("normalizeUnit handles common aliases", () => {
  assert.equal(normalizeUnit("quilo"), "kg");
  assert.equal(normalizeUnit("kg"), "kg");
  assert.equal(normalizeUnit("dúzia"), "duzia");
});

test("convertQuantity converts weight units", () => {
  assert.equal(convertQuantity(1, "kg", "g"), 1000);
  assert.equal(convertQuantity(500, "g", "kg"), 0.5);
});

test("convertUnitCost converts purchase cost to ingredient base unit", () => {
  assert.equal(convertUnitCost(12, "kg", "g"), 0.012);
});

test("areUnitsCompatible rejects incompatible groups", () => {
  assert.equal(areUnitsCompatible("kg", "ml"), false);
});
