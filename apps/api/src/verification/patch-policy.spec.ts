import { describe, expect, it } from 'vitest';
import { analyzePatch } from './patch-policy.js';

const header = (path: string, extra = '') =>
  `diff --git a/${path} b/${path}\n${extra}--- a/${path}\n+++ b/${path}\n@@ -1 +1 @@\n-a\n+b\n`;

describe('analyzePatch', () => {
  it('accepts changes under src/ and a new test file', () => {
    const patch =
      header('src/login.js') +
      header('test/new.test.js', 'new file mode 100644\n');
    const result = analyzePatch(patch);
    expect(result.ok).toBe(true);
    expect(result.addsTestFile).toBe(true);
  });

  it('does not count source-only patches as adding a test', () => {
    const result = analyzePatch(header('src/login.js'));
    expect(result.ok).toBe(true);
    expect(result.addsTestFile).toBe(false);
  });

  it('rejects package.json, path traversal and non-diff text', () => {
    expect(analyzePatch(header('package.json')).ok).toBe(false);
    expect(analyzePatch(header('src/../../evil.js')).ok).toBe(false);
    expect(analyzePatch('just some text').ok).toBe(false);
  });

  it('rejects symlinks and deletions', () => {
    expect(analyzePatch(header('src/link', 'new file mode 120000\n')).ok).toBe(
      false,
    );
    expect(
      analyzePatch(header('src/a.js', 'deleted file mode 100644\n')).ok,
    ).toBe(false);
  });
});
