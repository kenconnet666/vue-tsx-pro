// 精简版的优先级（priority.ts）与 StyleX 的 getPriority 逐项一致：它的属性表里的每个属性、各种条件写法
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { getPriority as stylexPriority } from '@stylexjs/shared';
import { describe, expect, it } from 'vitest';
import { getPriority } from '../src/stylex/priority';
import { CONDITIONS, when } from '../src/stylex/runtime';

/** StyleX 属性表里登记的全部属性（源码里一行一个 xxx.add('属性')） */
const properties = [
  ...readFileSync(
    createRequire(import.meta.url).resolve('@stylexjs/shared/lib/utils/property-priorities.js'),
    'utf8',
  ).matchAll(/^\w+\.add\('([^']+)'\)/gm),
].map((match) => match[1]!);

const marker = { xmarker: 'xmarker', $$css: true } as const;
const conditions = [
  ...Object.values(CONDITIONS),
  ':hover',
  ':focus-visible',
  ':focusVisible',
  ':nth-child(2n)',
  ':hover::before',
  ':hover:not(:disabled,[aria-disabled="true"])',
  '::placeholder',
  '@media (min-width: 640px)',
  '@supports (display: grid)',
  '@container (min-width: 20rem)',
  '--x-width',
  when.ancestor(':hover', marker),
  when.descendant(':focus', marker),
  when.siblingBefore(':hover', marker),
  when.siblingAfter(':active', marker),
  when.anySibling(':hover', marker),
];

describe('getPriority', () => {
  it('属性表里的每个属性与 StyleX 相同', () => {
    expect(properties.length).toBeGreaterThan(400);
    for (const property of [...properties, 'not-a-property']) {
      expect([property, getPriority(property)]).toEqual([property, stylexPriority(property)]);
    }
  });

  it('伪类、伪元素、@ 规则、when.* 的关系选择器与 StyleX 相同', () => {
    for (const condition of conditions) {
      expect([condition, getPriority(condition)]).toEqual([condition, stylexPriority(condition)]);
    }
  });
});
