import { describe, it, expect } from 'vitest';
import { determinePackContext } from './matrix-assessment';

/**
 * Regression tests for BSR compliance engine bug fixes.
 *
 * Bug 1 (fixed commit 9f16092): normalise() in deterministic-rules.ts now strips
 *   underscores/hyphens so 'fire_strategy' docType matches 'fire strategy' patterns.
 *
 * Bug 2 (fixed commit 82def83): assessPackAgainstMatrix() now deduplicates results
 *   by matrix_id using a Map — deterministic results take priority over LLM results.
 *
 * Bug 3 (fixed commit 01c5c42): runMatrixAssessment() in analysis.ts now extracts
 *   height/storeys from document text when DB metadata fields are null, preventing
 *   isHRB from silently defaulting to false.
 */

describe('determinePackContext — isHRB detection (Bug 3 regression)', () => {
  it('returns isHRB: false when both height and storeys are null', () => {
    const ctx = determinePackContext(null, 'residential', null, null);
    expect(ctx.isHRB).toBe(false);
  });

  it('returns isHRB: true when height string is 18m or above', () => {
    const ctx = determinePackContext(null, 'residential', '22m', null);
    expect(ctx.isHRB).toBe(true);
  });

  it('returns isHRB: true when height string uses metres keyword', () => {
    const ctx = determinePackContext(null, 'residential', '18.5 metres', null);
    expect(ctx.isHRB).toBe(true);
  });

  it('returns isHRB: false when height is below 18m', () => {
    const ctx = determinePackContext(null, 'residential', '15m', null);
    expect(ctx.isHRB).toBe(false);
  });

  it('returns isHRB: true when storeys string is 7 or above', () => {
    const ctx = determinePackContext(null, 'residential', null, '7');
    expect(ctx.isHRB).toBe(true);
  });

  it('returns isHRB: true when storeys string is greater than 7', () => {
    const ctx = determinePackContext(null, 'residential', null, '12 storeys');
    expect(ctx.isHRB).toBe(true);
  });

  it('returns isHRB: false when storeys is below 7', () => {
    const ctx = determinePackContext(null, 'residential', null, '6');
    expect(ctx.isHRB).toBe(false);
  });

  it('returns isHRB: true when both height and storeys independently qualify', () => {
    const ctx = determinePackContext(null, 'residential', '22m', '8 storeys');
    expect(ctx.isHRB).toBe(true);
  });

  it('does not throw when all arguments are null', () => {
    expect(() => determinePackContext(null, null, null, null)).not.toThrow();
  });
});

describe('determinePackContext — isLondon detection', () => {
  it('returns isLondon: true for a known London borough', () => {
    const ctx = determinePackContext('kensington', 'residential', null, null);
    expect(ctx.isLondon).toBe(true);
  });

  it('returns isLondon: true for borough with mixed case', () => {
    const ctx = determinePackContext('Westminster', 'residential', null, null);
    expect(ctx.isLondon).toBe(true);
  });

  it('returns isLondon: false for a non-London location', () => {
    const ctx = determinePackContext('manchester', 'residential', null, null);
    expect(ctx.isLondon).toBe(false);
  });

  it('returns isLondon: false when borough is null', () => {
    const ctx = determinePackContext(null, 'residential', null, null);
    expect(ctx.isLondon).toBe(false);
  });
});

describe('determinePackContext — heightMeters and storeys passthrough', () => {
  it('exposes parsed heightMeters in returned context', () => {
    const ctx = determinePackContext(null, 'residential', '22m', null);
    expect(ctx.heightMeters).toBe(22);
  });

  it('exposes parsed storeys in returned context', () => {
    const ctx = determinePackContext(null, 'residential', null, '8');
    expect(ctx.storeys).toBe(8);
  });

  it('returns null heightMeters when height string is null', () => {
    const ctx = determinePackContext(null, 'residential', null, null);
    expect(ctx.heightMeters).toBeNull();
  });
});
