import { test } from "node:test";
import assert from "node:assert/strict";
import { computePointsAvailable } from "./points";

test("computePointsAvailable: lista vazia não vale pontos", () => {
  assert.equal(computePointsAvailable([]), 0);
});

test("computePointsAvailable: desafios normais valem 10 cada", () => {
  assert.equal(computePointsAvailable([{ isBonus: false }, { isBonus: false }]), 20);
});

test("computePointsAvailable: desafios de lição bónus valem 20 cada", () => {
  assert.equal(computePointsAvailable([{ isBonus: true }, { isBonus: true }]), 40);
});

test("computePointsAvailable: mistura de desafios normais e de bónus na mesma amostra", () => {
  assert.equal(
    computePointsAvailable([{ isBonus: false }, { isBonus: true }, { isBonus: false }]),
    40,
  );
});
