// Progress、Skeleton、SkeletonText、Alert
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Alert } from '../Alert';
import { Progress } from '../Progress';
import { Skeleton } from '../Skeleton';
import { SkeletonText } from '../SkeletonText';
import { SHIMMER_STAGGER } from '../../utils/style/shimmer';

const first = (root: Element) => root.firstElementChild as HTMLElement;

describe('Progress', () => {
  it('有值：role="progressbar"，取值夹在范围内，默认念百分比', () => {
    const el = first(mount(() => <Progress value={150} max={200} aria-label="上传" />));
    expect(el.getAttribute('role')).toBe('progressbar');
    expect([el.getAttribute('aria-valuenow'), el.getAttribute('aria-valuemax')]).toEqual([
      '150',
      '200',
    ]);
    expect(el.getAttribute('aria-valuetext')).toBe('75%');
    expect(el.dataset.state).toBe('loading');
    expect(first(mount(() => <Progress value={999} aria-label="x" />)).dataset.state).toBe(
      'complete',
    );
  });

  it('没有值：不确定进度，不带 aria-valuenow；valueText 可以自定义', () => {
    const el = first(mount(() => <Progress aria-label="加载" />));
    expect(el.hasAttribute('aria-valuenow')).toBe(false);
    expect(el.dataset.state).toBe('indeterminate');
    const custom = first(
      mount(() => (
        <Progress value={2} max={5} valueText={(v, m) => `${v} / ${m} 个文件`} aria-label="x" />
      )),
    );
    expect(custom.getAttribute('aria-valuetext')).toBe('2 / 5 个文件');
  });
});

describe('Skeleton', () => {
  it('包着内容：内容在但不可见、不可交互，占位对读屏隐藏；加载完只渲染内容', async () => {
    let loading = _state(true);
    const root = mount(() => (
      <Skeleton loading={loading}>
        <a href="#">链接</a>
      </Skeleton>
    ));
    const placeholder = first(root);
    expect(placeholder.getAttribute('aria-hidden')).toBe('true');
    expect(placeholder.hasAttribute('inert')).toBe(true);
    expect(placeholder.querySelector('a')).not.toBeNull();
    loading = false;
    await nextTick();
    expect(first(root).tagName).toBe('A');
  });

  it('形状预设各自给出大小，sx 可以覆盖；不包内容时也对读屏隐藏', () => {
    const root = mount(() => (
      <>
        <Skeleton variant="circle" />
        <Skeleton variant="text" />
        <Skeleton />
      </>
    ));
    const [circle, text, plain] = [...root.children] as HTMLElement[];
    expect(circle!.className).not.toBe(text!.className);
    expect(plain!.className).not.toBe(text!.className);
    for (const el of [circle, text, plain]) expect(el!.getAttribute('aria-hidden')).toBe('true');
  });

  it('delay 为 0 或不写时不加延迟样式', () => {
    const root = mount(() => (
      <>
        <Skeleton />
        <Skeleton delay={0} />
        <Skeleton delay={SHIMMER_STAGGER} />
      </>
    ));
    const [plain, zero, delayed] = [...root.children] as HTMLElement[];
    expect(zero!.className).toBe(plain!.className);
    expect(zero!.hasAttribute('style')).toBe(false);
    expect(delayed!.getAttribute('style')).toContain(`${SHIMMER_STAGGER}ms`);
  });
});

describe('SkeletonText', () => {
  it('lines 行骨架，最后一行短一些，各行扫光依次错开；整块对读屏隐藏', () => {
    const root = first(mount(() => <SkeletonText lines={4} delay={100} />));
    expect(root.getAttribute('aria-hidden')).toBe('true');
    const lines = [...root.children] as HTMLElement[];
    expect(lines).toHaveLength(4);
    expect(lines[1]!.className).toBe(lines[2]!.className);
    expect(lines[3]!.className).not.toBe(lines[2]!.className);
    // 延迟写在内联的 CSS 变量里：从 delay 起，每行晚 SHIMMER_STAGGER
    const delays = lines.map((line) => line.getAttribute('style'));
    expect(delays[0]).toContain('100ms');
    expect(delays[1]).toContain(`${100 + SHIMMER_STAGGER}ms`);
    expect(new Set(delays).size).toBe(4);
    // 只有一行时不缩短
    const single = first(first(mount(() => <SkeletonText lines={1} delay={100} />)));
    expect(single.className).toBe(lines[0]!.className);
  });
});

describe('Alert', () => {
  it('图标按色调默认选，可以去掉；live 决定角色；标题、正文、操作各有部件', () => {
    const root = mount(() => (
      <>
        <Alert
          tone="success"
          title="已保存"
          action={<button>撤销</button>}
          propsTitle={{ class: 't' }}
        >
          修改已生效
        </Alert>
        <Alert tone="danger" live="assertive" icon={false}>
          出错了
        </Alert>
        <Alert live="polite">提示</Alert>
      </>
    ));
    const [saved, error, polite] = root.children as unknown as HTMLElement[];
    expect(saved!.hasAttribute('role')).toBe(false);
    expect(saved!.querySelector('svg')).not.toBeNull();
    expect(saved!.querySelector('.t')!.textContent).toBe('已保存');
    expect(error!.getAttribute('role')).toBe('alert');
    expect(error!.querySelector('svg')).toBeNull();
    expect(polite!.getAttribute('role')).toBe('status');
  });

  it('给了 onClose 才有关闭按钮；离场结束后才调用', async () => {
    const onClose = vi.fn();
    const root = mount(() => <Alert onClose={onClose}>x</Alert>);
    const button = root.querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('关闭');
    button.click();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
