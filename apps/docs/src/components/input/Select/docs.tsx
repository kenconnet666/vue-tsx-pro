import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import comboboxApi from 'virtual:api/ComboboxBaseProps';
import listboxApi from 'virtual:api/ListboxBaseProps';
import api from 'virtual:api/SelectBaseProps';
import tagsApi from 'virtual:api/TagsInputBaseProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Assign from './demo/Assign.tsx?demo';
import Cities from './demo/Cities.tsx?demo';
import Columns from './demo/Columns.tsx?demo';
import Tags from './demo/Tags.tsx?demo';

export const meta = {
  title: 'Select 选择器',
  description:
    '从一列选项里选：下拉的 Select、边输入边选的 Combobox、输入多个标签的 TagsInput、平铺的 Listbox。数据层相同，选项多时都虚拟滚动。',
  order: 3,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Combobox, Listbox, Select, TagsInput } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="select" title="Select" demo={Assign}>
        <Code>items</Code>{' '}
        可以是字符串、ListboxOption（值、文字、图标、说明、分组、不可用），或任意数据加{' '}
        <Code>toOption</Code>；子节点是渲染函数时自定义选项内容，拿到的是原始数据。
        <Code>selectionMode="multiple"</Code> 多选。键盘同原生 select：按字母选中以它开头的项。
      </Example>
      <Example id="combobox" title="Combobox" demo={Cities}>
        默认本地过滤（忽略大小写与重音），中文输入法组合期间不拿拼音去过滤。远程搜索写{' '}
        <Code>filter={'{false}'}</Code>，监听 <Code>inputValue</Code> 换 <Code>items</Code>，配合{' '}
        <Code>loading</Code>；只用最后一次输入的结果。
      </Example>
      <Example id="tags" title="TagsInput" demo={Tags}>
        回车、逗号或分号加一个标签，粘贴时自动拆开，重复的不加；输入框空着时退格删掉最后一个。给了{' '}
        <Code>items</Code> 就有建议列表；<Code>allowCustomValue={'{false}'}</Code> 只能从建议里选，
        <Code>max</Code> 限制个数。
      </Example>
      <Example id="listbox" title="Listbox" demo={Columns}>
        平铺的列表框，适合常驻在页面上的选择（表格显示哪些列、穿梭框的一侧）。一千个选项也只渲染看得见的几十个；焦点在列表上，按字母跳转。
      </Example>
    </Examples>
    <ApiReference api={[api, comboboxApi, tagsApi, listboxApi]} />
  </DocPage>
));
