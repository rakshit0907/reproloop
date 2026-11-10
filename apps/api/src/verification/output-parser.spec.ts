import { describe, expect, it } from 'vitest';
import { parseTestSummary } from './output-parser.js';

describe('parseTestSummary', () => {
  it('reads the spec reporter summary', () => {
    expect(
      parseTestSummary('ℹ tests 2\nℹ suites 0\nℹ pass 1\nℹ fail 1\n'),
    ).toEqual({
      tests: 2,
      failed: 1,
    });
  });

  it('reads the TAP summary and returns null when absent', () => {
    expect(parseTestSummary('# tests 3\n# pass 3\n# fail 0\n')).toEqual({
      tests: 3,
      failed: 0,
    });
    expect(parseTestSummary('no summary here')).toEqual({
      tests: null,
      failed: null,
    });
  });
});
