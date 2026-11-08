// @vitest-environment node
// process.json 的写法：设计器重写后与 prettier 格式化的原文件一样，版本对比里只有真改的行
import { expect, it } from 'vitest';
import source from '../processes/contract/process.json?raw';
import { stringify } from './project';

it('合同的 process.json 读进来再写出去，原样不变', () => {
  expect(stringify(JSON.parse(source))).toBe(source);
});
