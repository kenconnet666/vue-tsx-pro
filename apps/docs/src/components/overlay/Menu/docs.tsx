import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import contextMenuApi from 'virtual:api/ContextMenuProps';
import itemApi from 'virtual:api/MenuItemProps';
import api from 'virtual:api/MenuProps';
import subApi from 'virtual:api/MenuSubProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Actions from './demo/Actions.tsx?demo';
import Files from './demo/Files.tsx?demo';
import View from './demo/View.tsx?demo';

export const meta = {
  title: 'Menu 菜单',
  description:
    '按钮弹出的一列操作：普通项、复选项、单选组、子菜单、链接项；ContextMenu 是从指针位置弹出的同一套菜单。',
  order: 3,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ContextMenu, Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuLinkItem, MenuRadioGroup, MenuRadioItem, MenuSub } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="actions" title="操作菜单" demo={Actions}>
        <Code>onAction</Code> 在点击、<Kbd>Enter</Kbd>、<Kbd>Space</Kbd> 时执行，随后关闭菜单。
        <Code>shortcut</Code> 只是提示文字，快捷键要自己绑；<Code>tone="danger"</Code>{' '}
        标出破坏性操作；<Code>MenuSub</Code> 是子菜单，指针斜着移过去不会误关（安全三角）。
      </Example>
      <Example id="checkable" title="复选与单选" demo={View}>
        <Code>MenuCheckboxItem</Code> 勾选后菜单不关，方便连续勾几项；<Code>MenuRadioGroup</Code>{' '}
        里选一项后关闭。<Code>label</Code> 是这一组的名称，读屏先念组名。
      </Example>
      <Example id="context-menu" title="右键菜单" demo={Files}>
        菜单项与 Menu 完全相同。区域本身不可聚焦：键盘用户聚焦里面的元素后按 <Kbd>Shift</Kbd> +{' '}
        <Kbd>F10</Kbd> 或菜单键，从元素左下角弹出；关闭后焦点回到原处。
      </Example>
    </Examples>
    <ApiReference api={[api, itemApi, subApi, contextMenuApi]} />
  </DocPage>
));
