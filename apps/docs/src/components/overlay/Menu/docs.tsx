import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import contextMenuApi from 'virtual:api/ContextMenuProps';
import checkboxItemApi from 'virtual:api/MenuCheckboxItemProps';
import groupApi from 'virtual:api/MenuGroupProps';
import itemApi from 'virtual:api/MenuItemProps';
import linkItemApi from 'virtual:api/MenuLinkItemProps';
import api from 'virtual:api/MenuProps';
import radioGroupApi from 'virtual:api/MenuRadioGroupProps';
import radioItemApi from 'virtual:api/MenuRadioItemProps';
import subApi from 'virtual:api/MenuSubProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Account from './demo/Account.tsx?demo';
import Actions from './demo/Actions.tsx?demo';
import Create from './demo/Create.tsx?demo';
import Files from './demo/Files.tsx?demo';
import View from './demo/View.tsx?demo';
import Zoom from './demo/Zoom.tsx?demo';

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
      <ExampleColumn>
        <Example id="actions" title="操作菜单" demo={Actions}>
          <Code>onAction</Code> 在点击、<Kbd>Enter</Kbd>、<Kbd>Space</Kbd> 时执行，随后关闭菜单。
          <Code>shortcut</Code> 显示成当前系统的写法（macOS 上是 ⌘），菜单挂载期间按下就执行这一项；
          <Code>tone="danger"</Code> 标出破坏性操作；<Code>MenuSub</Code>{' '}
          是子菜单，指针斜着移过去不会误关（安全三角）。
        </Example>
        <Example id="description" title="带说明的菜单项" demo={Create}>
          <Code>description</Code>{' '}
          是名称下方的一行说明，弱化显示；读屏先念名称、再把说明作为描述念出， 不混进名称里。
          <Code>MenuGroup</Code> 的 <Code>label</Code> 是组标题，也是这一组的名称。
        </Example>
        <Example id="checkable" title="复选与单选" demo={View}>
          <Code>MenuCheckboxItem</Code> 勾选后菜单不关，方便连续勾几项；<Code>MenuRadioGroup</Code>{' '}
          里选一项后关闭。<Code>label</Code> 是这一组的名称，读屏先念组名。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="account" title="账户菜单：链接项" demo={Account}>
          触发器可以是任何接住 <Code>props</Code> 的元素。<Code>MenuLinkItem</Code> 是{' '}
          <Code>a</Code> 元素：站内地址经路由跳转，中键、右键在新标签页打开照常可用；
          <Code>disabled</Code> 时去掉 href、方向键跳过它。
        </Example>
        <Example id="zoom" title="尺寸与连续操作" demo={Zoom}>
          <Code>size</Code> 是菜单的字号档位，菜单项、图标、内边距随之缩放；不写时跟随上下文。
          <Code>closeOnSelect={'{false}'}</Code>{' '}
          让执行后不关菜单，适合放大、缩小这类要连按几次的操作。
        </Example>
        <Example id="context-menu" title="右键菜单" demo={Files}>
          菜单项与 Menu 完全相同。区域本身不可聚焦：键盘用户聚焦里面的元素后按 <Kbd>Shift</Kbd> +{' '}
          <Kbd>F10</Kbd> 或菜单键，从元素左下角弹出；关闭后焦点回到原处。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Enter / Space / ↓', '在触发器上：打开菜单并聚焦第一项'],
        ['↑', '在触发器上：打开菜单并聚焦最后一项'],
        ['↓ / ↑', '移到下一项 / 上一项，到头后循环；跳过不可用的项'],
        ['Home / End', '移到第一项 / 最后一项'],
        ['字母键', '移到下一个以它开头的项'],
        ['Enter / Space', '执行这一项；复选项切换勾选，单选项选中'],
        ['→ / ←', '打开子菜单并聚焦第一项 / 关闭子菜单回到上一级（从右到左排版时反过来）'],
        ['Esc', '关闭这一级菜单，焦点回到触发器（或上一级的那一项）'],
        ['Tab', '关闭整串菜单，焦点继续往后走'],
        ['Shift+F10 / ContextMenu', '在右键菜单的区域里：从聚焦的元素弹出菜单'],
      ]}
    >
      菜单遵循 WAI-ARIA 的 Menu Button 模式：触发器是 <Code>aria-haspopup="menu"</Code>{' '}
      的按钮，菜单里只有一项在 Tab 顺序里（漫游焦点）。
    </KeyboardReference>
    <ApiReference
      api={[
        api,
        itemApi,
        checkboxItemApi,
        radioGroupApi,
        radioItemApi,
        linkItemApi,
        groupApi,
        subApi,
        contextMenuApi,
      ]}
    />
  </DocPage>
));
