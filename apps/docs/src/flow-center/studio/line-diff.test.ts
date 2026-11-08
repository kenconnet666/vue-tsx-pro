// @vitest-environment node
// 逐行比：加的、删的、相同的，离改动远的相同行折起来
import { expect, it } from 'vitest';
import { diffLines } from './line-diff';

it('改一行：旧的删、新的加，前后的相同行留着', () => {
  expect(diffLines('a\nb\nc', 'a\nB\nc')).toEqual([
    { kind: 'same', text: 'a' },
    { kind: 'removed', text: 'b' },
    { kind: 'added', text: 'B' },
    { kind: 'same', text: 'c' },
  ]);
});

it('离改动超过上下文的相同行折成一段', () => {
  const before = Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n');
  const after = `${before}\nnew`;
  const lines = diffLines(before, after, 2);
  expect(lines[0]).toEqual({ kind: 'skipped', count: 10 });
  expect(lines.at(-1)).toEqual({ kind: 'added', text: 'new' });
  expect(lines.filter((l) => l.kind === 'same')).toHaveLength(2);
});
