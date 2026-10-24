// Progress、Skeleton、SkeletonText、Alert
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { Alert } from '../Alert';
import Decimal from 'decimal.js';
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
        <Progress
          value={2}
          max={5}
          valueText={(v, m) => `${v.toString()} / ${m.toString()} 个文件`}
          aria-label="x"
        />
      )),
    );
    expect(custom.getAttribute('aria-valuetext')).toBe('2 / 5 个文件');
  });

  it('bigint、Decimal：按原值比较与夹住，valueText 拿到原值', () => {
    const big = first(
      mount(() => (
        <Progress
          value={9_007_199_254_740_993n}
          max={9_007_199_254_740_993n}
          valueText={(v) => `${v.toString()} 字节`}
          aria-label="x"
        />
      )),
    );
    expect(big.dataset.state).toBe('complete');
    expect(big.getAttribute('aria-valuetext')).toBe('9007199254740993 字节');
    const money = first(
      mount(() => (
        <Progress value={new Decimal('150.5')} max={new Decimal('100')} aria-label="y" />
      )),
    );
    expect(money.getAttribute('aria-valuenow')).toBe('100');
    expect(money.getAttribute('aria-valuetext')).toBe('100%');
  });

  it('target：条上画目标线（按比例定位），读屏念在进度后面', () => {
    const el = first(mount(() => <Progress value={60} target={80} aria-label="完成率" />));
    expect(el.getAttribute('aria-valuetext')).toBe('60%，目标 80%');
    const line = el.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(line).not.toBeNull();
  });

  it('环形：根元素是 progressbar，中间显示百分比（对读屏隐藏）；有 label 时外层加标签、名称指向它', () => {
    const ring = first(mount(() => <Progress shape="circle" value={72} aria-label="完成率" />));
    expect(ring.getAttribute('role')).toBe('progressbar');
    expect(ring.getAttribute('aria-valuenow')).toBe('72');
    expect(ring.querySelectorAll('circle')).toHaveLength(2);
    const center = ring.querySelector('[aria-hidden="true"]:not(svg)')!;
    expect(center.textContent).toBe('72%');

    const labelled = first(
      mount(() => <Progress shape="circle" value={40} target={50} label="本月完成率" />),
    );
    const bar = labelled.querySelector('[role="progressbar"]')!;
    expect(document.getElementById(bar.getAttribute('aria-labelledby')!)!.textContent).toBe(
      '本月完成率',
    );
    expect(bar.querySelector('line')).not.toBeNull();

    const spinning = first(mount(() => <Progress shape="circle" aria-label="加载中" />));
    expect(spinning.dataset.state).toBe('indeterminate');
    expect(spinning.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('label：上方的标签是名称，右侧默认显示百分比；valueLabel 换文字，showValueLabel 可以关掉', () => {
    const root = first(
      mount(() => (
        <Progress
          value={38}
          max={50}
          label="存储空间"
          valueLabel="38 / 50 GB"
          propsRoot={{ class: 'shell' }}
        />
      )),
    );
    expect(root.classList.contains('shell')).toBe(true);
    const bar = root.querySelector<HTMLElement>('[role="progressbar"]')!;
    expect(document.getElementById(bar.getAttribute('aria-labelledby')!)!.textContent).toBe(
      '存储空间',
    );
    const value = root.querySelector('[aria-hidden="true"]')!;
    expect(value.textContent).toBe('38 / 50 GB');
    // 读屏念的仍是 aria-valuetext
    expect(bar.getAttribute('aria-valuetext')).toBe('76%');

    const percent = first(mount(() => <Progress value={64} label="资料完善度" />));
    expect(percent.textContent).toContain('64%');
    const hidden = first(
      mount(() => <Progress value={64} label="完善度" showValueLabel={false} />),
    );
    expect(hidden.textContent).toBe('完善度');
    // 不确定进度没有数值；没有 label 时进度条就是根元素
    expect(first(mount(() => <Progress label="加载" />)).textContent).toBe('加载');
    expect(first(mount(() => <Progress value={1} aria-label="x" />)).getAttribute('role')).toBe(
      'progressbar',
    );
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
    expect(styleTextOf(delayed!)).toContain(`${SHIMMER_STAGGER}ms`);
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
    const delays = lines.map((line) => styleTextOf(line));
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

  it('说明写在 description 或 children 上；两个都给时 children 是说明下面的额外内容', () => {
    const root = mount(() => (
      <>
        <Alert
          description="成功 120 条"
          propsDescription={{ class: 'd' }}
          propsContent={{ class: 'c' }}
        >
          <a href="#log">查看失败原因</a>
        </Alert>
        <Alert propsDescription={{ class: 'd' }}>只有 children</Alert>
      </>
    ));
    const [both, only] = root.children as unknown as HTMLElement[];
    expect(both!.querySelector('.d')!.textContent).toBe('成功 120 条');
    expect(both!.querySelector('.c a')!.textContent).toBe('查看失败原因');
    expect(only!.querySelector('.d')!.textContent).toBe('只有 children');
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
