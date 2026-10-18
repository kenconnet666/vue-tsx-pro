// Progress、Skeleton、Alert、Card、Avatar
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Alert } from '../Alert';
import { Avatar, initials } from '../Avatar';
import { Card } from '../Card';
import { Progress } from '../Progress';
import { Skeleton } from '../Skeleton';

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

  it('给了 onClose 才有关闭按钮', () => {
    const onClose = vi.fn();
    const root = mount(() => <Alert onClose={onClose}>x</Alert>);
    const button = root.querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('关闭');
    button.click();
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Card', () => {
  it('页头、正文、页脚各一层，都能加部件属性；没有页头页脚时只有正文', () => {
    const full = first(
      mount(() => (
        <Card header="标题" footer="操作" propsHeader={{ class: 'h' }} propsBody={{ class: 'b' }}>
          内容
        </Card>
      )),
    );
    expect([...full.children].map((el) => el.textContent)).toEqual(['标题', '内容', '操作']);
    expect(full.querySelector('.h')).not.toBeNull();
    expect(first(mount(() => <Card>内容</Card>)).children).toHaveLength(1);
  });
});

describe('Avatar', () => {
  it.each([
    ['张三', '三'],
    ['Ada Lovelace', 'AL'],
    ['grace', 'G'],
    ['  ', ''],
  ])('initials(%s) = %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it('role="img" 加名称；没有图片时显示首字母；图片失败时退回首字母', async () => {
    const plain = first(mount(() => <Avatar name="张三" />));
    expect([plain.getAttribute('role'), plain.getAttribute('aria-label')]).toEqual(['img', '张三']);
    expect(plain.textContent).toBe('三');
    // 没有名字：装饰性的，不是没有名称的图片
    const anonymous = first(mount(() => <Avatar />));
    expect([anonymous.hasAttribute('role'), anonymous.getAttribute('aria-hidden')]).toEqual([
      false,
      'true',
    ]);

    const withImage = first(mount(() => <Avatar name="Ada Lovelace" src="/missing.png" />));
    const img = withImage.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('');
    img.dispatchEvent(new Event('error'));
    await nextTick();
    expect(withImage.querySelector('img')).toBeNull();
    expect(withImage.textContent).toBe('AL');
    expect(withImage.dataset.state).toBe('error');
  });
});
