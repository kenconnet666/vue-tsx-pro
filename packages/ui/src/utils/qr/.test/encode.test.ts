// 二维码编码器：Reed–Solomon 按 ISO/IEC 18004 附录 I 的例子、格式与版本信息按标准的表、容量与校正图形位置；
// 再用测试里另写的解码器把矩阵读回来（功能图形、之字形顺序、分块交织都独立实现），内容与纠错码字都对得上
import { describe, expect, it } from 'vitest';
import {
  alignmentPositions,
  dataCodewords,
  encodeQr,
  formatBits,
  rawDataModules,
  reedSolomon,
  versionBits,
  type QrErrorCorrection,
  type QrMatrix,
} from '../encode';

// prettier-ignore
const FORMAT_TABLE: Record<QrErrorCorrection, string[]> = {
  L: ['111011111000100', '111001011110011', '111110110101010', '111100010011101', '110011000101111', '110001100011000', '110110001000001', '110100101110110'],
  M: ['101010000010010', '101000100100101', '101111001111100', '101101101001011', '100010111111001', '100000011001110', '100111110010111', '100101010100000'],
  Q: ['011010101011111', '011000001101000', '011111100110001', '011101000000110', '010010010110100', '010000110000011', '010111011011010', '010101111101101'],
  H: ['001011010001001', '001001110111110', '001110011100111', '001100111010000', '000011101100010', '000001001010101', '000110100001100', '000100000111011'],
};

/** 被测的几种版本与纠错等级的分块（ISO/IEC 18004 表 9）：块数、每块纠错码字数 */
const BLOCKS: Record<string, [count: number, eccLength: number]> = {
  '3-M': [1, 26],
  '5-H': [4, 22],
  '13-L': [4, 26],
  '17-Q': [16, 28],
  '37-H': [70, 30],
};

/** 测试自己的解码：按标准读出格式信息、去掉掩码、按之字形取码字、拆块、核对纠错、读出字节模式的内容 */
function decode(qr: QrMatrix): { text: string; ecc: QrErrorCorrection; mask: number } {
  const { size, version } = qr;
  const at = (x: number, y: number) => (qr.isDark(x, y) ? 1 : 0);

  // 格式信息：左上角那份（第 8 列自上而下、第 8 行自右而左），与右上、左下那份一致
  const first: number[] = [];
  for (let y = 0; y <= 5; y++) first.push(at(8, y));
  first.push(at(8, 7), at(8, 8), at(7, 8));
  for (let x = 5; x >= 0; x--) first.push(at(x, 8));
  const second: number[] = [];
  for (let x = size - 1; x >= size - 8; x--) second.push(at(x, 8));
  for (let y = size - 7; y < size; y++) second.push(at(8, y));
  expect(second).toEqual(first);
  const format = first.reduce((value, b, index) => value | (b << index), 0);
  const [ecc, mask] = (['L', 'M', 'Q', 'H'] as const)
    .flatMap((level) => FORMAT_TABLE[level].map((bits, m) => [level, m, bits] as const))
    .find(([, , bits]) => parseInt(bits, 2) === format)!;
  expect(at(8, size - 8)).toBe(1);

  // 功能图形
  const fixed = new Set<string>();
  const mark = (x: number, y: number) => fixed.add(`${x},${y}`);
  for (let i = 0; i < size; i++) {
    mark(6, i);
    mark(i, 6);
  }
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      mark(x, y);
      if (x < 8) mark(size - 1 - x, y);
      if (y < 8) mark(x, size - 1 - y);
    }
  }
  mark(8, size - 8);
  const centers = alignmentPositions(version);
  for (const cy of centers) {
    for (const cx of centers) {
      // 落在定位图形里的三个角不画（落在定时图形上的照画）
      const inFinder = (cx < 9 || cx > size - 9) && (cy < 9 || cy > size - 9);
      if (inFinder && !(cx > size - 9 && cy > size - 9)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mark(cx + dx, cy + dy);
    }
  }
  if (version >= 7) {
    for (let a = size - 11; a < size - 8; a++) {
      for (let b = 0; b < 6; b++) {
        mark(a, b);
        mark(b, a);
      }
    }
  }
  expect(size * size - fixed.size).toBe(rawDataModules(version));

  // 之字形：从右下角两列一组，上去、下来交替，跳过第 6 列
  const bits: number[] = [];
  let upward = true;
  for (let x = size - 1; x > 0; x -= 2) {
    if (x === 6) x = 5;
    for (let k = 0; k < size; k++) {
      const y = upward ? size - 1 - k : k;
      for (const cx of [x, x - 1]) {
        if (fixed.has(`${cx},${y}`)) continue;
        const flip = [
          (cx + y) % 2 === 0,
          y % 2 === 0,
          cx % 3 === 0,
          (cx + y) % 3 === 0,
          (Math.floor(y / 2) + Math.floor(cx / 3)) % 2 === 0,
          ((cx * y) % 2) + ((cx * y) % 3) === 0,
          (((cx * y) % 2) + ((cx * y) % 3)) % 2 === 0,
          (((cx + y) % 2) + ((cx * y) % 3)) % 2 === 0,
        ][mask];
        bits.push(at(cx, y) ^ (flip ? 1 : 0));
      }
    }
    upward = !upward;
  }
  const codewords: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((value, b) => (value << 1) | b, 0));
  }

  // 拆块：块数与每块纠错码字数照标准的表 9 写在 BLOCKS 里，前面的块短一个数据码字
  const [blockCount, eccLength] = BLOCKS[`${version}-${ecc}`]!;
  const dataTotal = Math.floor(rawDataModules(version) / 8) - blockCount * eccLength;
  expect(dataCodewords(version, ecc)).toBe(dataTotal);
  const shortData = Math.floor(dataTotal / blockCount);
  const longBlocks = dataTotal % blockCount;
  const lengths = Array.from({ length: blockCount }, (_, i) =>
    i < blockCount - longBlocks ? shortData : shortData + 1,
  );
  const blocks = lengths.map(() => [] as number[]);
  let k = 0;
  for (let c = 0; c <= shortData; c++) {
    blocks.forEach((block, b) => c < lengths[b]! && block.push(codewords[k++]!));
  }
  const eccs = blocks.map(() => [] as number[]);
  for (let c = 0; c < eccLength; c++) eccs.forEach((block) => block.push(codewords[k++]!));
  blocks.forEach((block, b) => expect(reedSolomon(block, eccLength)).toEqual(eccs[b]));

  // 字节模式：0100、字符数（版本 1–9 是 8 位，之后 16 位）、字节
  const stream = blocks
    .flat()
    .flatMap((byte) => byte.toString(2).padStart(8, '0').split('').map(Number));
  let position = 0;
  const read = (length: number) => {
    const value = stream.slice(position, position + length).reduce((v, b) => (v << 1) | b, 0);
    position += length;
    return value;
  };
  expect(read(4)).toBe(0b0100);
  const count = read(version <= 9 ? 8 : 16);
  const bytes = Uint8Array.from({ length: count }, () => read(8));
  return { text: new TextDecoder().decode(bytes), ecc, mask };
}

describe('二维码编码器', () => {
  it('Reed–Solomon：ISO/IEC 18004 附录 I（1-M，“01234567”）与 1-M “HELLO WORLD” 的纠错码字', () => {
    expect(
      reedSolomon([16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17], 10),
    ).toEqual([0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55]);
    expect(
      reedSolomon([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17], 10),
    ).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
  });

  it('格式信息与版本信息：与标准的表一致', () => {
    for (const ecc of ['L', 'M', 'Q', 'H'] as const) {
      FORMAT_TABLE[ecc].forEach((bits, mask) =>
        expect(formatBits(ecc, mask).toString(2).padStart(15, '0')).toBe(bits),
      );
    }
    expect([versionBits(7), versionBits(8), versionBits(21), versionBits(40)]).toEqual([
      0x07c94, 0x085bc, 0x15683, 0x28c69,
    ]);
  });

  it('容量与校正图形的位置', () => {
    expect((['L', 'M', 'Q', 'H'] as const).map((ecc) => dataCodewords(1, ecc))).toEqual([
      19, 16, 13, 9,
    ]);
    expect((['L', 'M', 'Q', 'H'] as const).map((ecc) => dataCodewords(40, ecc))).toEqual([
      2956, 2334, 1666, 1276,
    ]);
    expect(dataCodewords(10, 'M')).toBe(216);
    expect(alignmentPositions(1)).toEqual([]);
    expect(alignmentPositions(2)).toEqual([6, 18]);
    expect(alignmentPositions(7)).toEqual([6, 22, 38]);
    expect(alignmentPositions(32)).toEqual([6, 34, 60, 86, 112, 138]);
    expect(alignmentPositions(40)).toEqual([6, 30, 58, 86, 114, 142, 170]);
  });

  it('选最小的版本；放不下时抛 RangeError', () => {
    expect(encodeQr('a'.repeat(17), { ecc: 'L' }).version).toBe(1);
    expect(encodeQr('a'.repeat(18), { ecc: 'L' }).version).toBe(2);
    expect(encodeQr('a'.repeat(2953), { ecc: 'L' }).version).toBe(40);
    expect(() => encodeQr('a'.repeat(2954), { ecc: 'L' })).toThrow(RangeError);
    expect(encodeQr('a', { minVersion: 5 }).size).toBe(37);
  });

  it('定位图形在三个角上', () => {
    const qr = encodeQr('https://example.com');
    const finder = ['1111111', '1000001', '1011101', '1011101', '1011101', '1000001', '1111111'];
    const read = (left: number, top: number) =>
      finder.map((_, y) =>
        Array.from({ length: 7 }, (_, x) => (qr.isDark(left + x, top + y) ? '1' : '0')).join(''),
      );
    expect(read(0, 0)).toEqual(finder);
    expect(read(qr.size - 7, 0)).toEqual(finder);
    expect(read(0, qr.size - 7)).toEqual(finder);
  });

  it('解码回来与原文一致：各档纠错、多块交织、版本 7 以上、指定掩码', () => {
    const cases: [string, QrErrorCorrection, number?][] = [
      ['https://example.com/?q=二维码', 'M'],
      ['扫码登录：请在 120 秒内确认', 'H'],
      ['供应商对账单 2026-11 '.repeat(12), 'Q'],
      ['x'.repeat(400), 'L', 3],
      ['长内容'.repeat(120), 'H'],
    ];
    for (const [text, ecc, mask] of cases) {
      const qr = encodeQr(text, { ecc, mask });
      const decoded = decode(qr);
      expect(decoded).toEqual({ text, ecc, mask: qr.mask });
      if (mask !== undefined) expect(qr.mask).toBe(mask);
    }
  });
});
