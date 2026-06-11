/**
 * Line-level diff algorithm (LCS-based Myers diff).
 *
 * Pure function — no side effects. Reusable across F-02 (version history)
 * and F-03 (A/B testing comparison).
 *
 * Returns an array of LineDiff entries covering the full text of both inputs.
 */

export interface LineDiff {
  type: 'added' | 'removed' | 'unchanged';
  line: string;
  /** 1-based line number in the relevant source (old for removed, new for added/unchanged) */
  lineNumber: number;
}

/**
 * Compute line-by-line diff between two text strings.
 * Uses LCS (longest common subsequence) for correctness.
 */
export function computeDiff(oldText: string, newText: string): LineDiff[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const lcs = computeLCS(oldLines, newLines);
  const result: LineDiff[] = [];

  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;
  let newLineNumber = 1;
  let oldLineNumber = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const inLCS = lcsIdx < lcs.length;
    const lcsLine = inLCS ? lcs[lcsIdx] : null;

    if (
      inLCS &&
      oldIdx < oldLines.length &&
      newIdx < newLines.length &&
      oldLines[oldIdx] === lcsLine &&
      newLines[newIdx] === lcsLine
    ) {
      // Common line — unchanged
      result.push({ type: 'unchanged', line: newLines[newIdx], lineNumber: newLineNumber });
      oldIdx++;
      newIdx++;
      lcsIdx++;
      newLineNumber++;
      oldLineNumber++;
    } else if (newIdx < newLines.length && (lcsLine === null || newLines[newIdx] !== lcsLine)) {
      // Line only in new — added
      result.push({ type: 'added', line: newLines[newIdx], lineNumber: newLineNumber });
      newIdx++;
      newLineNumber++;
    } else {
      // Line only in old — removed
      result.push({ type: 'removed', line: oldLines[oldIdx], lineNumber: oldLineNumber });
      oldIdx++;
      oldLineNumber++;
    }
  }

  return result;
}

/** Compute Longest Common Subsequence of two string arrays. */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // dp[i][j] = length of LCS of a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to get LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/** Count added and removed lines in a diff result. */
export function diffStats(diff: LineDiff[]): { added: number; removed: number } {
  return diff.reduce(
    (acc, d) => ({
      added: acc.added + (d.type === 'added' ? 1 : 0),
      removed: acc.removed + (d.type === 'removed' ? 1 : 0),
    }),
    { added: 0, removed: 0 },
  );
}
