// 状态映射：定义顺序即阶段顺序，选项给筛选用，不认识的状态不报错
import { describe, expect, it } from 'vitest';
import { createStatusMap } from '../status';

const statuses = createStatusMap({
  pending: { label: '待启动', tone: 'neutral' },
  verifying: { label: '验证中', tone: 'info', description: '产品团队与供应商验证实施' },
  closed: { label: '关闭', tone: 'success' },
});

describe('createStatusMap', () => {
  it('按定义的顺序给出 key 与阶段位置；名字与色调', () => {
    expect(statuses.keys).toEqual(['pending', 'verifying', 'closed']);
    expect(statuses.order('verifying')).toBe(1);
    expect(statuses.label('closed')).toBe('关闭');
    expect(statuses.tone('verifying')).toBe('info');
  });

  it('不认识的状态：中性色、名字是 key、位置 -1', () => {
    expect(statuses.get('suspended')).toEqual({ label: 'suspended', tone: 'neutral' });
    expect(statuses.order('suspended')).toBe(-1);
  });

  it('options 给 Select、筛选用，可以只取一部分', () => {
    expect(statuses.options().map((option) => option.value)).toEqual([
      'pending',
      'verifying',
      'closed',
    ]);
    expect(statuses.options(['verifying'])).toEqual([
      {
        value: 'verifying',
        label: '验证中',
        description: '产品团队与供应商验证实施',
        icon: undefined,
      },
    ]);
  });
});
