/**
 * 二维码编码器（ISO/IEC 18004）：文字按 UTF-8 走字节模式，四档纠错，自动选最小的版本（1–40）与罚分最低的掩码。
 * 结构参考 Nayuki 的 QR Code generator（MIT）：Reed–Solomon 纠错、分块交织、功能图形、之字形放置数据、掩码罚分。
 *
 *   const qr = encodeQr('https://example.com', { ecc: 'M' });
 *   qr.size;            边长（模块数，不含静区）
 *   qr.isDark(x, y);    第 y 行第 x 列是不是深色
 *
 * 数据放不下最大的版本时抛 RangeError。只做字节模式：数字、字母数字模式更紧凑，但链接、中文都是字节模式，省下的不多。
 */

/** 纠错等级：能恢复约 7%、15%、25%、30% 的损坏（中间放 logo 时用 H） */
export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

/** 编码选项 */
export interface QrEncodeOptions {
  /** 纠错等级，默认 M */
  ecc?: QrErrorCorrection;
  /** 最小版本（1–40），默认 1：想让不同长度的内容一样大时调高 */
  minVersion?: number;
  /** 指定掩码（0–7）；默认按罚分自动选 */
  mask?: number;
}

/** 编码结果 */
export interface QrMatrix {
  /** 版本（1–40） */
  readonly version: number;
  /** 边长（模块数）：版本 × 4 + 17 */
  readonly size: number;
  /** 纠错等级 */
  readonly ecc: QrErrorCorrection;
  /** 用的掩码（0–7） */
  readonly mask: number;
  /** 第 y 行第 x 列是不是深色（越界为 false） */
  isDark(x: number, y: number): boolean;
}

const ECC_INDEX: Record<QrErrorCorrection, number> = { L: 0, M: 1, Q: 2, H: 3 };
/** 格式信息里纠错等级的两位 */
const ECC_FORMAT_BITS: Record<QrErrorCorrection, number> = { L: 1, M: 0, Q: 3, H: 2 };

// 每个版本、每档纠错：每块的纠错码字数、块数（ISO/IEC 18004 表 9；下标 0 不用）
// prettier-ignore
const ECC_CODEWORDS_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
// prettier-ignore
const ECC_BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

/** 掩码条件：第 y 行第 x 列为真时翻转（ISO/IEC 18004 表 10） */
const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** 版本 version 里放数据与纠错码字的模块数（去掉功能图形） @internal */
export function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alignments = Math.floor(version / 7) + 2;
    result -= (25 * alignments - 10) * alignments - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** 版本 version、纠错等级 ecc 能放的数据码字数 @internal */
export function dataCodewords(version: number, ecc: QrErrorCorrection): number {
  const level = ECC_INDEX[ecc];
  return (
    Math.floor(rawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[level]![version]! * ECC_BLOCKS[level]![version]!
  );
}

/** 校正图形中心的行列坐标（版本 1 没有） @internal */
export function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const result = [6];
  for (let position = version * 4 + 10; result.length < count; position -= step) {
    result.splice(1, 0, position);
  }
  return result;
}

/** GF(2^8) 上的乘法，本原多项式 x^8 + x^4 + x^3 + x^2 + 1（0x11D） */
function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

/** Reed–Solomon 生成多项式（degree 次，最高次项系数 1 省略，从高到低） */
function reedSolomonDivisor(degree: number): number[] {
  const result = Array.from({ length: degree }, () => 0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j]!, root);
      if (j + 1 < result.length) result[j]! ^= result[j + 1]!;
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

/** data 的纠错码字：data 乘 x^n 除以生成多项式的余数 @internal */
export function reedSolomon(data: readonly number[], eccLength: number): number[] {
  const divisor = reedSolomonDivisor(eccLength);
  const result = Array.from({ length: eccLength }, () => 0);
  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);
    divisor.forEach((coefficient, index) => (result[index]! ^= gfMultiply(coefficient, factor)));
  }
  return result;
}

/** 15 位格式信息：纠错等级与掩码，BCH(15,5) 校验后与 0x5412 异或 @internal */
export function formatBits(ecc: QrErrorCorrection, mask: number): number {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  return ((data << 10) | remainder) ^ 0x5412;
}

/** 18 位版本信息（版本 7 起）：BCH(18,6) @internal */
export function versionBits(version: number): number {
  let remainder = version;
  for (let i = 0; i < 12; i++) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
  return (version << 12) | remainder;
}

const bit = (value: number, index: number) => ((value >>> index) & 1) !== 0;

/** 数据码字：模式 0100、字符数、字节，终止符与补齐（0xEC、0x11 交替） */
function dataCodewordsOf(bytes: Uint8Array, version: number, ecc: QrErrorCorrection): number[] {
  const bits: number[] = [];
  const append = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  append(0b0100, 4);
  append(bytes.length, version <= 9 ? 8 : 16);
  for (const byte of bytes) append(byte, 8);
  const capacity = dataCodewords(version, ecc) * 8;
  append(0, Math.min(4, capacity - bits.length));
  append(0, (8 - (bits.length % 8)) % 8);
  const result: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    result.push(bits.slice(i, i + 8).reduce((byte, b) => (byte << 1) | b, 0));
  }
  for (let pad = 0xec; result.length < capacity / 8; pad ^= 0xec ^ 0x11) result.push(pad);
  return result;
}

/** 分块、各块算纠错码字，再按列交织成最终的码字序列 */
function interleave(data: readonly number[], version: number, ecc: QrErrorCorrection): number[] {
  const level = ECC_INDEX[ecc];
  const blockCount = ECC_BLOCKS[level]![version]!;
  const eccLength = ECC_CODEWORDS_PER_BLOCK[level]![version]!;
  const total = Math.floor(rawDataModules(version) / 8);
  const shortBlocks = blockCount - (total % blockCount);
  const shortLength = Math.floor(total / blockCount);
  const blocks: number[][] = [];
  for (let i = 0, offset = 0; i < blockCount; i++) {
    const length = shortLength - eccLength + (i < shortBlocks ? 0 : 1);
    const block = data.slice(offset, offset + length);
    offset += length;
    // 短块在数据末尾占一个空位，交织时跳过，块长一致好按列取
    if (i < shortBlocks) block.push(0);
    blocks.push([...block, ...reedSolomon(block.slice(0, length), eccLength)]);
  }
  const result: number[] = [];
  for (let column = 0; column < blocks[0]!.length; column++) {
    blocks.forEach((block, index) => {
      if (column !== shortLength - eccLength || index >= shortBlocks) result.push(block[column]!);
    });
  }
  return result;
}

/** 按版本、纠错等级画出全部模块（掩码选定前的状态与功能图形标记） */
class Grid {
  readonly version: number;
  readonly size: number;
  readonly dark: Uint8Array;
  readonly fixed: Uint8Array;

  constructor(version: number) {
    this.version = version;
    this.size = version * 4 + 17;
    this.dark = new Uint8Array(this.size * this.size);
    this.fixed = new Uint8Array(this.size * this.size);
  }

  set(x: number, y: number, dark: boolean) {
    this.dark[y * this.size + x] = dark ? 1 : 0;
    this.fixed[y * this.size + x] = 1;
  }

  /** 定位图形（含白边分隔）、定时图形、校正图形、版本信息、格式信息的位置 */
  drawFunctionPatterns(ecc: QrErrorCorrection) {
    const { size } = this;
    for (let i = 0; i < size; i++) {
      this.set(6, i, i % 2 === 0);
      this.set(i, 6, i % 2 === 0);
    }
    for (const [cx, cy] of [
      [3, 3],
      [size - 4, 3],
      [3, size - 4],
    ] as const) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || x >= size || y < 0 || y >= size) continue;
          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          this.set(x, y, distance !== 2 && distance !== 4);
        }
      }
    }
    const positions = alignmentPositions(this.version);
    const last = positions.length - 1;
    positions.forEach((cy, row) =>
      positions.forEach((cx, column) => {
        // 与三个定位图形重叠的角上不画
        if ((row === 0 && column === 0) || (row === 0 && column === last)) return;
        if (row === last && column === 0) return;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            this.set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
          }
        }
      }),
    );
    this.drawFormat(ecc, 0);
    if (this.version >= 7) {
      const bits = versionBits(this.version);
      for (let i = 0; i < 18; i++) {
        const a = size - 11 + (i % 3);
        const b = Math.floor(i / 3);
        this.set(a, b, bit(bits, i));
        this.set(b, a, bit(bits, i));
      }
    }
  }

  /** 两份格式信息与固定的深色模块 */
  drawFormat(ecc: QrErrorCorrection, mask: number) {
    const { size } = this;
    const bits = formatBits(ecc, mask);
    for (let i = 0; i <= 5; i++) this.set(8, i, bit(bits, i));
    this.set(8, 7, bit(bits, 6));
    this.set(8, 8, bit(bits, 7));
    this.set(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) this.set(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) this.set(8, size - 15 + i, bit(bits, i));
    this.set(8, size - 8, true);
  }

  /** 码字按之字形放进非功能模块：从右下角起，两列一组上下来回，跳过第 6 列（竖的定时图形） */
  drawCodewords(codewords: readonly number[]) {
    const { size } = this;
    let index = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      const upward = ((right + 1) & 2) === 0;
      for (let vertical = 0; vertical < size; vertical++) {
        const y = upward ? size - 1 - vertical : vertical;
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          if (this.fixed[y * size + x]) continue;
          // 码字之外剩下的几个模块（余位）留作浅色
          if (index < codewords.length * 8) {
            this.dark[y * size + x] = bit(codewords[index >>> 3]!, 7 - (index & 7)) ? 1 : 0;
          }
          index++;
        }
      }
    }
  }

  /** 按掩码翻转数据模块（再调用一次就还原） */
  applyMask(mask: number) {
    const { size } = this;
    const flip = MASKS[mask]!;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!this.fixed[y * size + x] && flip(x, y)) this.dark[y * size + x]! ^= 1;
      }
    }
  }

  /** 罚分（ISO/IEC 18004 7.8.3）：连续同色、2×2 同色块、类似定位图形的 1:1:3:1:1、深浅比例 */
  penalty(): number {
    const { size, dark } = this;
    const at = (x: number, y: number) => dark[y * size + x]!;
    let score = 0;
    for (let line = 0; line < size; line++) {
      for (const read of [(i: number) => at(i, line), (i: number) => at(line, i)]) {
        let run = 1;
        for (let i = 1; i <= size; i++) {
          if (i < size && read(i) === read(i - 1)) {
            run++;
            continue;
          }
          if (run >= 5) score += 3 + run - 5;
          run = 1;
        }
        // 最近 11 个模块滚动成一个整数，比对 1011101 前后带四个浅色的两种排列
        let window = 0;
        for (let i = 0; i < size; i++) {
          window = ((window << 1) & 0x7ff) | read(i);
          if (i >= 10 && (window === 0b10111010000 || window === 0b00001011101)) score += 40;
        }
      }
    }
    let darkCount = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        darkCount += at(x, y);
        if (x + 1 < size && y + 1 < size) {
          const color = at(x, y);
          if (color === at(x + 1, y) && color === at(x, y + 1) && color === at(x + 1, y + 1)) {
            score += 3;
          }
        }
      }
    }
    const total = size * size;
    score += (Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1) * 10;
    return score;
  }
}

/** 把文字（UTF-8）或字节编码成二维码 */
export function encodeQr(data: string | Uint8Array, options: QrEncodeOptions = {}): QrMatrix {
  const { ecc = 'M', minVersion = 1 } = options;
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let version = Math.max(1, Math.min(40, minVersion));
  const fits = (v: number) =>
    4 + (v <= 9 ? 8 : 16) + bytes.length * 8 <= dataCodewords(v, ecc) * 8 &&
    bytes.length < (v <= 9 ? 256 : 65536);
  while (version <= 40 && !fits(version)) version++;
  if (version > 40) {
    throw new RangeError(
      `二维码放不下 ${bytes.length} 字节（纠错等级 ${ecc} 最多 ${dataCodewords(40, ecc) - 3} 字节）`,
    );
  }

  const grid = new Grid(version);
  grid.drawFunctionPatterns(ecc);
  grid.drawCodewords(interleave(dataCodewordsOf(bytes, version, ecc), version, ecc));

  let mask = options.mask;
  if (mask === undefined) {
    let best = Infinity;
    for (let candidate = 0; candidate < 8; candidate++) {
      grid.applyMask(candidate);
      grid.drawFormat(ecc, candidate);
      const score = grid.penalty();
      if (score < best) {
        best = score;
        mask = candidate;
      }
      grid.applyMask(candidate);
    }
  }
  grid.applyMask(mask!);
  grid.drawFormat(ecc, mask!);

  const { size } = grid;
  return {
    version,
    size,
    ecc,
    mask: mask!,
    isDark: (x, y) => x >= 0 && x < size && y >= 0 && y < size && grid.dark[y * size + x] === 1,
  };
}
