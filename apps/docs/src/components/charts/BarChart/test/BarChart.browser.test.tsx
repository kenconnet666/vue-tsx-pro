// BarChart 在真实浏览器里：Unovis 画出柱子，悬停出提示框，图例隐藏系列，颜色与坐标轴跟随主题
import { _component } from '@vue-tsx-pro/tsx';
import { createUi, darkTheme } from '@vue-tsx-pro/ui';
import { BarChart } from '@vue-tsx-pro/ui/charts';
import { afterEach, expect, it } from 'vitest';
import { createApp, h, type App } from 'vue';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Basic from '../demo/Basic';

const bars = (root: Element) => root.querySelectorAll('[class*="grouped-bar-component"] path');

it('每个类目一组柱子：6 个项目 × 2 个系列', async () => {
  const root = mount(Basic);
  await until(() => bars(root).length === 12);
});

it('悬停一个类目：提示框列出这一组的各系列，数值带单位', async () => {
  const root = mount(Basic);
  await until(() => bars(root).length === 12);
  // 等进场动画（主题的 lg 时长）结束，柱子到位
  await new Promise((resolve) => setTimeout(resolve, 500));
  const svg = root.querySelector('svg')!;
  const box = svg.getBoundingClientRect();
  // 移到第二组的柱子上（柱子按组排列：每组 2 根）
  const second = bars(root)[2]!.getBoundingClientRect();
  svg.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: second.left + second.width / 2,
      clientY: box.top + box.height / 2,
    }),
  );
  const text = await until(() => {
    const content = root.querySelector('[role="figure"] [aria-hidden="true"]')!.textContent!;
    return content.includes('预期降本') && content;
  });
  expect(text).toContain('项目 02');
  // 数字与单位之间是不换行的空格
  expect(text).toContain('280\u00a0万元');
  expect(text).toContain('438.4\u00a0万元');
});

it('点图例隐藏一个系列：只剩 6 根柱子，再点恢复', async () => {
  const root = mount(Basic);
  await until(() => bars(root).length === 12);
  const actual = [...root.querySelectorAll<HTMLButtonElement>('[role="group"] button')][1]!;
  actual.click();
  await until(() => bars(root).length === 6);
  actual.click();
  await until(() => bars(root).length === 12);
});

let app: App | undefined;
afterEach(() => app?.unmount());

it('暗色主题：坐标轴文字取主题的次要文字色，系列颜色是图表色板', async () => {
  const host = document.body.appendChild(document.createElement('div'));
  app = createApp(_component(() => () => h(Basic))).use(createUi({ theme: darkTheme }));
  app.mount(host);
  const tick = await until(() => host.querySelector('svg text') ?? undefined);
  // 暗色主题的 textMuted（slate 11）
  expect(getComputedStyle(tick).fill).toBe('rgb(176, 180, 186)');
  const first = await until(() => bars(host)[0]);
  // chart1 跟随品牌色 indigo 9
  expect(getComputedStyle(first).fill).toBe('rgb(62, 99, 221)');
  host.remove();
});

it('一页多张图没有重复的 id（Unovis 的高亮滤镜换成各自的 id）', async () => {
  const root = mount(_component(() => () => [h(Basic), h(Basic)]));
  await until(() => bars(root).length === 24);
  const ids = [...root.querySelectorAll('[id]')].map((element) => element.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it('加载中之后再显示：绘图区换了元素，容器与坐标轴整套重建，柱子与刻度照常画出', async () => {
  let loading = _state(false);
  const rows = [
    { name: 'A', value: 3 },
    { name: 'B', value: 5 },
  ];
  const root = mount(
    _component(() => () => (
      <BarChart
        aria-label="重建"
        data={rows}
        index="name"
        series={[{ key: 'value', label: '数量' }]}
        loading={loading}
      />
    )),
  );
  await until(() => bars(root).length === 2);
  loading = true;
  await until(() => bars(root).length === 0);
  loading = false;
  await until(() => bars(root).length === 2);
  // 坐标轴是新容器里新建的：类目刻度照常显示
  await until(() =>
    [...root.querySelectorAll('svg text')].some((text) => text.textContent === 'B'),
  );
});

it('放在按内容定宽的容器里（表格式的滚动区、起始对齐的弹性布局），容器变窄时图表跟着变窄重画', async () => {
  const data = [
    { name: 'A', value: 40 },
    { name: 'B', value: 65 },
    { name: 'C', value: 52 },
  ];
  // 外层 table 按内容定宽：画好的 SVG 写死了宽度，不能反过来把它撑住
  const root = mount(
    _component(() => () => (
      <div class="outer" style="width: 800px">
        <div style="display: table; min-width: 100%">
          <div style="display: flex; flex-direction: column; align-items: flex-start">
            <BarChart
              aria-label="宽度"
              data={data}
              index="name"
              series={[{ key: 'value', label: '数值' }]}
            />
          </div>
        </div>
      </div>
    )),
  );
  const svgWidth = () => Number(root.querySelector('[role="figure"] svg')?.getAttribute('width'));
  await until(() => svgWidth() > 700);
  root.querySelector<HTMLElement>('.outer')!.style.width = '400px';
  await until(() => svgWidth() > 0 && svgWidth() <= 400);
});
