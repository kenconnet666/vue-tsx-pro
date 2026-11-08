/**
 * 两段文字逐行比（版本对比的代码部分）：最长公共子序列，文件都不大（几百行），O(n·m) 足够。
 * 相同的长段只留前后几行上下文，中间折成一行“省略 n 行”。
 */

/** 一行：两边都有、只在新的里、只在旧的里，或折起来的相同行 */
export type DiffLine =
  | { readonly kind: 'same' | 'added' | 'removed'; readonly text: string }
  | { readonly kind: 'skipped'; readonly count: number };

export function diffLines(before: string, after: string, context = 3): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');
  // lcs[i][j]：a[i..] 与 b[j..] 的最长公共子序列长度
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i]![j] =
        a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
  const lines: { kind: 'same' | 'added' | 'removed'; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ kind: 'same', text: a[i]! });
      i++;
      j++;
    } else if (i < a.length && (j === b.length || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)) {
      // 一样长时先写删掉的（同 git diff：先旧后新）
      lines.push({ kind: 'removed', text: a[i]! });
      i++;
    } else {
      lines.push({ kind: 'added', text: b[j]! });
      j++;
    }
  }
  return fold(lines, context);
}

/** 离改动超过 context 行的相同行折起来 */
function fold(
  lines: readonly { kind: 'same' | 'added' | 'removed'; text: string }[],
  context: number,
): DiffLine[] {
  const near = lines.map((_, index) =>
    lines
      .slice(Math.max(0, index - context), index + context + 1)
      .some((line) => line.kind !== 'same'),
  );
  const result: DiffLine[] = [];
  for (const [index, line] of lines.entries()) {
    if (line.kind !== 'same' || near[index]) {
      result.push(line);
      continue;
    }
    const last = result.at(-1);
    if (last?.kind === 'skipped')
      result[result.length - 1] = { kind: 'skipped', count: last.count + 1 };
    else result.push({ kind: 'skipped', count: 1 });
  }
  return result;
}
