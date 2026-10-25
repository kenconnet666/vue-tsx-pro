// TreeSelect：触发框里的文字、多选只列最上层的整枝（标签可移除、maxTagCount）、checkedStrategy、清空、表单提交；
// 弹出的树与键盘见浏览器里的文档页
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
      <TreeSelect items={orgs} {...accessors} _value="landing" aria-label="单位" />
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
          _value={value}
          name="orgs"
          clearable
          placeholder="全部"
          aria-label="单位"
        />
      </form>
    ));
    const trigger = root.querySelector('button[role="combobox"]')!;
    // 标签排在触发按钮前面；按钮里念全部
    const tags = () => [...trigger.previousElementSibling!.children].map((tag) => tag.textContent);
    expect(tags()).toEqual(['总装制造中心', '采购部']);
    expect(trigger.textContent).toBe('总装制造中心、采购部');
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

  it('checkedStrategy：移除标签取消整枝，value 按取法写回（parent 只放父节点、child 只放叶子）', async () => {
    let parents = _state<string[]>(['assembly', 'purchase']);
    let leaves = _state<string[]>(['system', 'landing', 'purchase']);
    const root = mount(() => (
      <>
        <TreeSelect
          items={orgs}
          {...accessors}
          selectionMode="multiple"
          checkedStrategy="parent"
          _value={parents}
          aria-label="单位"
        />
        <TreeSelect
          items={orgs}
          {...accessors}
          selectionMode="multiple"
          checkedStrategy="child"
          _value={leaves}
          aria-label="成员"
        />
      </>
    ));
    const [parentTrigger, childTrigger] =
      root.querySelectorAll<HTMLButtonElement>('button[role="combobox"]');
    // child：标签列叶子
    expect(childTrigger!.textContent).toBe('总体技术集成团队、起落架团队、采购部');
    // Backspace 移除最后一个标签
    parentTrigger!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    await nextTick();
    expect(parents).toEqual(['assembly']);
    // 移除叶子“起落架团队”：只剩它的兄弟
    const remove = [...childTrigger!.previousElementSibling!.querySelectorAll('button')][1]!;
    remove.click();
    for (let index = 0; index < 5; index++) await nextTick();
    expect(leaves).toEqual(['system', 'purchase']);
  });

  it('maxTagCount：其余收进“+N”', () => {
    const root = mount(() => (
      <TreeSelect
        items={orgs}
        {...accessors}
        selectionMode="multiple"
        checkedStrategy="child"
        _value={['system', 'landing', 'purchase']}
        maxTagCount={2}
        aria-label="成员"
      />
    ));
    const row = root.querySelector('button[role="combobox"]')!.previousElementSibling!;
    expect([...row.children].map((tag) => tag.textContent)).toEqual([
      '总体技术集成团队',
      '起落架团队',
      '+1',
    ]);
  });
});
