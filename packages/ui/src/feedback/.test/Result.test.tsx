// Result：按状态选图标与颜色，各部分是部件；图标默认描线（时长为 0 时直接画好，不报错）
import { CircleX } from '@lucide/icons';
import { expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Result } from '../Result';

it('色调写到 data-tone；标题、说明、操作、内容依次排列', () => {
  const root = mount(() => (
    <Result
      tone="danger"
      title="支付失败"
      description="余额不足"
      action={<button>重试</button>}
      propsTitle={{ class: 'title' }}
    >
      <code>E42</code>
    </Result>
  )).firstElementChild as HTMLElement;
  expect(root.dataset.tone).toBe('danger');
  expect(root.querySelector('svg')).not.toBeNull();
  expect(root.querySelector('.title')!.textContent).toBe('支付失败');
  expect(root.textContent).toBe('支付失败余额不足E42重试');
});

it('图标可以换、可以去掉', () => {
  const root = mount(() => (
    <>
      <Result icon={CircleX} draw={false} />
      <Result icon={false} title="无图标" />
    </>
  ));
  expect(root.querySelectorAll('svg')).toHaveLength(1);
});
