export interface PatchAnalysis {
  ok: boolean;
  reasons: string[];
  files: string[];
  addsTestFile: boolean;
}

const ALLOWED_PREFIXES = ['src/', 'test/'];
const MAX_PATCH_CHARS = 200_000;

function pathProblem(path: string): string | null {
  if (
    path.startsWith('/') ||
    /^[A-Za-z]:/.test(path) ||
    path.split('/').includes('..')
  ) {
    return `Unsafe path: ${path}`;
  }
  if (!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return `Only files under src/ and test/ may be changed (got ${path})`;
  }
  return null;
}

export function analyzePatch(patchText: string): PatchAnalysis {
  const reasons: string[] = [];
  const files = new Set<string>();
  let addsTestFile = false;
  let headers = 0;
  let current: { path: string; isNew: boolean } | null = null;

  if (patchText.length > MAX_PATCH_CHARS) reasons.push('Patch is too large');

  const closeCurrent = () => {
    if (current?.isNew && current.path.startsWith('test/')) addsTestFile = true;
  };

  for (const line of patchText.replace(/\r\n/g, '\n').split('\n')) {
    const header = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (header) {
      closeCurrent();
      headers += 1;
      const [, from, to] = header;
      if (from !== to) reasons.push('Renames and copies are not allowed');
      for (const path of [from, to]) {
        const problem = pathProblem(path);
        if (problem) reasons.push(problem);
        files.add(path);
      }
      current = { path: to, isNew: false };
      continue;
    }

    if (
      /^(deleted file mode|rename |copy |old mode|new mode|similarity index|GIT binary patch|Binary files)/.test(
        line,
      )
    ) {
      reasons.push(
        `Unsupported patch feature: ${line.split(' ').slice(0, 3).join(' ')}`,
      );
    }

    const newFile = /^new file mode (\d+)$/.exec(line);
    if (newFile) {
      if (newFile[1] !== '100644') {
        reasons.push('New files must be regular, non-executable files');
      } else if (current) {
        current.isNew = true;
      }
    }
  }
  closeCurrent();

  if (headers === 0)
    reasons.push('Patch must be in git diff format (diff --git headers)');
  return {
    ok: reasons.length === 0,
    reasons: [...new Set(reasons)],
    files: [...files],
    addsTestFile,
  };
}
