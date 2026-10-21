// useSelectedOptions：按值查已选项；items 换掉之后仍按见过的文字显示，没见过的显示值本身
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useSelectedOptions } from '../list-state';

interface Person {
  id: string;
  name: string;
}

describe('useSelectedOptions', () => {
  it('远程搜索换了 items：已选的人仍显示名字，item 是原来的数据', () => {
    const items = ref<Person[]>([
      { id: 'E10732', name: '林小满' },
      { id: 'E20418', name: '周一航' },
    ]);
    const selectedOf = useSelectedOptions({
      items: () => items.value,
      toOption: (person) => ({ value: person.id, label: person.name }),
    });
    expect(selectedOf(['E10732']).map((option) => option.label)).toEqual(['林小满']);
    // 换成另一页的搜索结果：E10732 不在里面了
    items.value = [{ id: 'E31056', name: '陈默' }];
    const [kept, fresh] = selectedOf(['E10732', 'E31056']);
    expect(kept).toMatchObject({ label: '林小满', item: { id: 'E10732', name: '林小满' } });
    expect(fresh!.label).toBe('陈默');
    // 从没见过的值：文字就是值，没有数据
    expect(selectedOf(['E99999'])[0]).toEqual({
      value: 'E99999',
      label: 'E99999',
      item: undefined,
    });
  });
});
