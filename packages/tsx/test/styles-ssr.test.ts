// @vitest-environment node
// 服务端渲染的样式：renderStyleTag 按 HTML 里用到的类名输出规则（含引用的关键帧与全部变量组），不带没用到的
import { expect, it } from 'vitest';
import { attrs, create, defineVars, keyframes, renderStyleTag } from '../src/styles/runtime';

it('只输出 HTML 用到的规则，加上它们引用的关键帧与变量组；data-names 列出这些名字', () => {
  defineVars('ssrdemo', { gap: '4px' });
  const spin = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
  const styles = create({
    used: { color: 'red', animationName: spin },
    unused: { color: 'blue' },
  });
  const used = attrs(styles.used).class!;
  const unused = attrs(styles.unused).class!;
  const tag = renderStyleTag(`<div class="host ${used}"><span class="plain"></span></div>`);
  expect(tag).toMatch(/^<style data-vue-tsx-pro data-names="[^"]*">/);
  expect(tag).toContain(`.${used}`);
  expect(tag).toContain(`@keyframes ${spin}`);
  expect(tag).toContain('--ssrdemo-gap');
  expect(tag).not.toContain(`.${unused}`);
  const names = /data-names="([^"]*)"/.exec(tag)![1]!.split(' ');
  expect(names).toContain(used);
  expect(names).toContain(spin);
  expect(names).not.toContain(unused);
});
