// 输入格式：分组显示、去掉分隔与过滤、截到最长、光标位置；TextField 的 format；手机号与身份证号的 schema
import { describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue';
import { idCardSchema, isValidIdCard, phoneSchema } from '../../form/schemas';
import { mount } from '../../utils/.test/mount';
import {
  bankCardFormat,
  createGroupedFormat,
  displayPosition,
  idCardFormat,
  phoneFormat,
} from '../text-format';
import { TextField } from '../TextField';

describe('格式', () => {
  it('手机号 3-4-4、身份证 6-8-4（X 转大写）、银行卡每 4 位，超出的组按最后一组接着分', () => {
    expect(phoneFormat.format('13800001111')).toBe('138 0000 1111');
    expect(phoneFormat.parse('138-0000 11112222')).toBe('13800001111');
    expect(idCardFormat.parse('11010519491231002x')).toBe('11010519491231002X');
    expect(idCardFormat.format('11010519491231002X')).toBe('110105 19491231 002X');
    expect(bankCardFormat.format('6222020200112233445')).toBe('6222 0202 0011 2233 445');
    expect(createGroupedFormat({ groups: [2], separator: '-' }).format('12345')).toBe('12-34-5');
  });

  it('displayPosition：原文第 n 个字符之后在显示文字里的位置（跳过分隔）', () => {
    expect(displayPosition(phoneFormat, '13800001111', 3)).toBe(3);
    expect(displayPosition(phoneFormat, '13800001111', 4)).toBe(5);
    expect(displayPosition(phoneFormat, '13800001111', 11)).toBe(13);
    expect(displayPosition(phoneFormat, '13800001111', 0)).toBe(0);
  });
});

describe('TextField 的 format', () => {
  it('显示分组的文字、值是原文；输入时重新分组，数字键盘', async () => {
    const state = reactive({ phone: '1380000' });
    const root = mount(() => (
      <TextField _value={state.phone} format={phoneFormat} aria-label="手机号" />
    ));
    const input = root.querySelector('input')!;
    expect(input.value).toBe('138 0000');
    expect(input.getAttribute('inputmode')).toBe('tel');
    input.value = '138 00001111';
    input.setSelectionRange(12, 12);
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(state.phone).toBe('13800001111');
    expect(input.value).toBe('138 0000 1111');
    expect(input.selectionStart).toBe(13);
  });
});

describe('schema', () => {
  it('手机号：1 开头、第二位 3–9、11 位', () => {
    expect(phoneSchema().safeParse('13800001111').success).toBe(true);
    expect(phoneSchema().safeParse('12800001111').success).toBe(false);
    expect(phoneSchema({ message: '手机号不对' }).safeParse('138').error!.issues[0]!.message).toBe(
      '手机号不对',
    );
  });

  it('身份证号：校验码与出生日期', () => {
    expect(isValidIdCard('11010519491231002X')).toBe(true);
    expect(isValidIdCard('110105194912310021')).toBe(false);
    // 2 月 30 日不存在
    expect(isValidIdCard('110105194902300028')).toBe(false);
    expect(idCardSchema().safeParse('11010519491231002X').success).toBe(true);
  });
});
