// Cell：可点击的判定、箭头、分组里最后一个不画细线（小程序端按元素兄弟判定 :last-child）
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Cell, CellGroup } from '../Cell';

describe('Cell（H5）', () => {
  it('有 onClick 或箭头时是 role="button"；标题、说明、值都渲染', () => {
    const onClick = vi.fn();
    const root = mount(() => (
      <CellGroup title="账户">
        <Cell title="昵称" value="莱恩" onClick={onClick} />
        <Cell title="手机号" description="用于登录" value="138" />
      </CellGroup>
    ));
    const cells = root.querySelectorAll('[role="button"]');
    expect(cells).toHaveLength(1);
    (cells[0] as HTMLElement).click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(root.textContent).toContain('账户昵称莱恩手机号用于登录138');
  });
});

describe('Cell（小程序）', () => {
  it('分组里最后一个单元格不画细线', async () => {
    const Demo = defineComponent(() => () => (
      <CellGroup>
        <Cell title="甲" />
        <Cell title="乙" />
        <Cell title="丙" />
      </CellGroup>
    ));
    const page = mountPage(Demo);
    await page.settle();
    const cellOf = (title: string) =>
      page.find(
        (node) =>
          node.st?.includes('min-height') === true &&
          JSON.stringify(node).includes(`"v":"${title}"`),
      )!;
    expect(cellOf('甲').st).toContain('linear-gradient');
    expect(cellOf('丙').st).toMatch(/background-image:none$|background-image:none;/);
  });
});
