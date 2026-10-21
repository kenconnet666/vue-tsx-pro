// TreeSelect：触发框里的文字、多选只列最上层的整枝、清空、表单提交；弹出的树与键盘见浏览器里的文档页
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { TreeSelect } from '../TreeSelect';

interface Org {
  id: string;
  name: string;
  children?: Org[];
}
const orgs: Org[] = [
  {
    id: 'assembly',
    name: '总装制造中心',
    children: [
      { id: 'system', name: '总体技术集成团队' },
      { id: 'landing', name: '起落架团队' },
    ],
  },
  { id: 'purchase', name: '采购部' },
];
const accessors = {
  getKey: (org: Org) => org.id,
  getLabel: (org: Org) => org.name,
  getChildren: (org: Org) => org.children,
};

describe('TreeSelect', () => {
  it('单选：显示节点的文字，触发按钮是 aria-haspopup="tree" 的 combobox', () => {
    const root = mount(() => (
      <TreeSelect items={orgs} {...accessors} value="landing" aria-label="单位" />
    ));
    const trigger = root.querySelector('button[role="combobox"]')!;
    expect(trigger.textContent).toBe('起落架团队');
    expect(trigger.getAttribute('aria-haspopup')).toBe('tree');
  });

  it('多选：父节点勾上时只列父节点；清空后显示占位；表单提交勾上的全部', async () => {
    let value = _state(['assembly', 'system', 'landing', 'purchase']);
    const root = mount(() => (
      <form>
        <TreeSelect
          items={orgs}
          {...accessors}
          selectionMode="multiple"
          value={_bind(value)}
          name="orgs"
          clearable
          placeholder="全部"
          aria-label="单位"
        />
      </form>
    ));
    const trigger = root.querySelector('button[role="combobox"]')!;
    expect([...trigger.querySelectorAll('span span')].map((tag) => tag.textContent)).toEqual([
      '总装制造中心',
      '采购部',
    ]);
    expect(new FormData(root.querySelector('form')!).getAll('orgs')).toEqual([
      'assembly',
      'system',
      'landing',
      'purchase',
    ]);
    root.querySelector<HTMLButtonElement>('button[aria-label="清空"]')!.click();
    await nextTick();
    expect(value).toEqual([]);
    expect(trigger.textContent).toBe('全部');
  });
});
