export interface TestSummary {
  tests: number | null;
  failed: number | null;
}

function pick(output: string, name: string): number | null {
  const match = new RegExp(`^\\s*(?:ℹ|#)?\\s*${name}\\s+(\\d+)\\s*$`, 'm').exec(
    output,
  );
  return match ? Number(match[1]) : null;
}

export function parseTestSummary(output: string): TestSummary {
  return { tests: pick(output, 'tests'), failed: pick(output, 'fail') };
}
