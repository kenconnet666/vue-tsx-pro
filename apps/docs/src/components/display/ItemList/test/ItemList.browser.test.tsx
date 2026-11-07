// ItemList 整条可点在真实浏览器里：点说明、空白处也等于点标题；结束边的按钮叠在上面，点它不选中这一条
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { ItemList, ItemListItem } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';

const center = (element: Element): [number, number] => {
  const box = element.getBoundingClientRect();
  return [box.left + box.width / 2, box.top + box.height / 2];
};

it('点说明选中这一条；点结束边的按钮只触发按钮', async () => {
  const log: string[] = [];
  const root = mount(
    _component(() => () => (
      <div style="width: 30rem">
        <ItemList>
          <ItemListItem
            title="资料审核"
            description="PO-2026-0187"
            onSelect={() => log.push('选中')}
            end={<button onClick={() => log.push('删除')}>删除</button>}
          />
        </ItemList>
      </div>
    )),
  );
  const row = root.querySelector('li')!;
  // 点整条的中间（说明那一块）：伸展的标题按钮盖在上面，点到的是它
  const description = row.querySelector('span span:nth-child(2)')!;
  expect(document.elementFromPoint(...center(description))!.closest('[data-item-action]')).not.toBe(
    null,
  );
  await userEvent.click(row);
  await userEvent.click([...row.querySelectorAll('button')].find((b) => b.textContent === '删除')!);
  expect(log).toEqual(['选中', '删除']);
});
