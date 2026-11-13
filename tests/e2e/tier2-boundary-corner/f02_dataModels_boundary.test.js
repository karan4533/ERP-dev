import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import {
  validateRequired,
  isValidDate,
  isNonNegativeNumber,
  isValidEmail,
  isValidEnum,
  calculateGst,
  computeGrade,
  CONFIDENTIALITY_TIERS,
} from '../../../src/services/models/index.js';

test('F02-T2-01: validateRequired detects null, undefined, empty string, and whitespace-only values', () => {
  const invalidData = {
    emptyStr: '',
    whitespaceOnly: '   ',
    nullVal: null,
    undefinedVal: undefined,
    validField: 'Proper Value',
  };

  const res = validateRequired(invalidData, [
    'emptyStr',
    'whitespaceOnly',
    'nullVal',
    'undefinedVal',
    'missingKey',
    'validField',
  ]);

  assert.equal(res.valid, false);
  assert.ok(res.errors.emptyStr);
  assert.ok(res.errors.whitespaceOnly);
  assert.ok(res.errors.nullVal);
  assert.ok(res.errors.undefinedVal);
  assert.ok(res.errors.missingKey);
  assert.equal(res.errors.validField, undefined);
});

test('F02-T2-02: isValidDate rejects malformed dates and non-date strings', () => {
  assert.equal(isValidDate(''), false);
  assert.equal(isValidDate(null), false);
  assert.equal(isValidDate(undefined), false);
  assert.equal(isValidDate('random-garbage-string'), false);
  assert.equal(isValidDate('not-a-date'), false);
  assert.equal(isValidDate('2026-99-99'), false);
});

test('F02-T2-03: isNonNegativeNumber rejects negative numbers, NaN, non-numeric strings, and null', () => {
  assert.equal(isNonNegativeNumber(-1), false);
  assert.equal(isNonNegativeNumber(-0.0001), false);
  assert.equal(isNonNegativeNumber(NaN), false);
  assert.equal(isNonNegativeNumber('abc'), false);
  assert.equal(isNonNegativeNumber(null), true); // Number(null) is 0, non-negative
  assert.equal(isNonNegativeNumber(0), true);
  assert.equal(isNonNegativeNumber(100.5), true);
  assert.equal(isNonNegativeNumber('500'), true);
});

test('F02-T2-04: isValidEnum rejects disallowed values and handles object dictionary or array definitions', () => {
  assert.equal(isValidEnum('Restricted', CONFIDENTIALITY_TIERS), true);
  assert.equal(isValidEnum('NonExistentTier', CONFIDENTIALITY_TIERS), false);
  assert.equal(isValidEnum(null, CONFIDENTIALITY_TIERS), false);
  assert.equal(isValidEnum('', CONFIDENTIALITY_TIERS), false);

  const allowedList = ['A1', 'A2', 'B1', 'B2'];
  assert.equal(isValidEnum('A1', allowedList), true);
  assert.equal(isValidEnum('F', allowedList), false);
});

test('F02-T2-05: calculateGst clamps negative base amounts and handles 0% and 0 base amount', () => {
  const zeroBase = calculateGst(0, 18);
  assert.equal(zeroBase.baseAmount, 0);
  assert.equal(zeroBase.gstAmount, 0);
  assert.equal(zeroBase.totalAmount, 0);

  const negBase = calculateGst(-5000, 18);
  assert.equal(negBase.baseAmount, 0);
  assert.equal(negBase.gstAmount, 0);
  assert.equal(negBase.totalAmount, 0);

  const zeroGst = calculateGst(1000, 0);
  assert.equal(zeroGst.baseAmount, 1000);
  assert.equal(zeroGst.gstAmount, 0);
  assert.equal(zeroGst.totalAmount, 1000);
});

test('F02-T2-06: computeGrade evaluates floating point boundaries and clamps values outside 0-100', () => {
  // CBSE float boundary evaluations
  assert.equal(computeGrade(90.9).grade, 'A1'); // 91%
  assert.equal(computeGrade(90.5).grade, 'A1'); // 91%
  assert.equal(computeGrade(90.4).grade, 'A2'); // 90%
  assert.equal(computeGrade(32.5).grade, 'D');  // 33% Pass boundary
  assert.equal(computeGrade(32.4).grade, 'E');  // 32% Fail boundary

  // Clamping
  assert.equal(computeGrade(150).grade, 'A1');  // Clamped to 100
  assert.equal(computeGrade(-20).grade, 'E');   // Clamped to 0
});
