/**
 * 组件演练场的预设：复杂属性（列表数据、触发器、子组件）的固定值，以及演练场里不列出的组件。
 * 没有预设的组件只靠控件调：必填项都能用控件调的才列出（见 PropsPlayground 的 isPlayable）。
 * 每项预览用的值与生成代码里的写法各写一份：值给预览渲染，源码给复制与带进代码演练场。
 */
import { Bell, Plus, Settings } from '@lucide/icons';
import {
  AccordionItem,
  Avatar,
  Button,
  Card,
  Checkbox,
  IconButton,
  ListItem,
  MenuItem,
  Radio,
  Tab,
  TabList,
  TabPanel,
  Tag,
  TextField,
  ToggleItem,
} from '@zerodep-dev/vue-tsx-pro-ui';
import type { VNodeChild } from 'vue';

/** 一个组件的预设 */
export interface Preset {
  /** 初始值，覆盖默认值：必填的文字、图标、数字 */
  initial?: Record<string, unknown>;
  /** 固定传的属性：预览用的值与源码写法 */
  fixed?: Record<string, { value: unknown; code: string }>;
  /** 内容：文字（面板里可以改），或固定的子节点与源码 */
  children?: string | { render: () => VNodeChild; code: string };
  /** 代码里另外用到的组件库导出 */
  imports?: string[];
  /** 代码里另外用到的图标 */
  icons?: string[];
}

/**
 * 不列出的组件：别的组件的内部部件、页面框架、要配合控制器或数据模型才能用的；
 * 只能放在父组件里的子部件（Tab、MenuItem…）随父组件的预设一起出现
 */
export const HIDDEN = new Set([
  'AccordionItem',
  'MenuCheckboxItem',
  'MenuGroup',
  'MenuItem',
  'MenuLinkItem',
  'MenuRadioGroup',
  'MenuRadioItem',
  'MenuSub',
  'Radio',
  'Tab',
  'TabList',
  'TabPanel',
  'ToggleItem',
  'AppShell',
  'ButtonBase',
  'CalendarView',
  'ColumnResizer',
  'ConfigScope',
  'DataTableRow',
  'DataTableView',
  'DateSegmentGroup',
  'Form',
  'FormValue',
  'ListboxView',
  'ModalCore',
  'OverlayScrollbar',
  'PageScrollbar',
  'PropsTable',
  'Provider',
  'SegmentedField',
  'SkipLink',
  'Table',
  'TableCell',
  'TableHeaderCell',
  'ThemeCustomizer',
  'ThemeSwitcher',
  'ToastItem',
  'Toaster',
  'VisuallyHidden',
]);

const fruits = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'grape', label: '葡萄' },
];
const fruitsCode = `[
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'grape', label: '葡萄' },
]`;
const options = { value: fruits, code: `{${fruitsCode}}` };

const steps = [{ title: '填写信息' }, { title: '确认订单' }, { title: '完成支付' }];
const stepsCode = `{[{ title: '填写信息' }, { title: '确认订单' }, { title: '完成支付' }]}`;

const triggerButton = (label: string) => ({
  value: (props: object) => (
    <Button {...props} variant="outline" tone="neutral">
      {label}
    </Button>
  ),
  code: `{(props) => (\n  <Button {...props} variant="outline" tone="neutral">\n    ${label}\n  </Button>\n)}`,
});

const paragraph = '演练场里的示例内容：调右侧的属性，看看组件怎么变化。';

export const PRESETS: Record<string, Preset> = {
  Button: { children: '按钮' },
  LinkButton: { initial: { href: '#' }, children: '链接按钮' },
  IconButton: { initial: { icon: 'Settings', 'aria-label': '设置' } },
  IconLinkButton: { initial: { href: '#', icon: 'Settings', 'aria-label': '设置' } },
  CopyButton: { initial: { value: 'pnpm add @zerodep-dev/vue-tsx-pro-ui' } },
  Icon: { initial: { icon: 'Heart' } },
  Link: { initial: { href: '#' }, children: '查看详情' },
  Badge: { children: '新功能' },
  Tag: { children: '标签' },
  Kbd: { children: 'Ctrl' },
  Code: { children: 'pnpm dev' },
  Mark: { children: '高亮的文字' },
  Text: { children: '一段文字' },
  Blockquote: { children: paragraph },
  CodeBlock: { initial: { code: "import { Button } from '@zerodep-dev/vue-tsx-pro-ui';" } },
  ButtonGroup: {
    imports: ['Button'],
    children: {
      render: () => [<Button>上一页</Button>, <Button>1 / 10</Button>, <Button>下一页</Button>],
      code: '<Button>上一页</Button>\n<Button>1 / 10</Button>\n<Button>下一页</Button>',
    },
  },
  Indicator: {
    imports: ['IconButton'],
    icons: ['Bell'],
    initial: { count: 3 },
    children: {
      render: () => <IconButton icon={Bell} variant="soft" aria-label="通知" />,
      code: '<IconButton icon={Bell} variant="soft" aria-label="通知" />',
    },
  },
  List: {
    imports: ['ListItem'],
    children: {
      render: () => [<ListItem>第一项</ListItem>, <ListItem>第二项</ListItem>],
      code: '<ListItem>第一项</ListItem>\n<ListItem>第二项</ListItem>',
    },
  },
  OrderedList: {
    imports: ['ListItem'],
    children: {
      render: () => [<ListItem>第一步</ListItem>, <ListItem>第二步</ListItem>],
      code: '<ListItem>第一步</ListItem>\n<ListItem>第二步</ListItem>',
    },
  },
  ListItem: { children: '列表项' },
  Spinner: {},
  Flex: {
    imports: ['Tag'],
    children: {
      render: () => [<Tag>一</Tag>, <Tag>二</Tag>, <Tag>三</Tag>],
      code: '<Tag>一</Tag>\n<Tag>二</Tag>\n<Tag>三</Tag>',
    },
  },
  Grid: {
    imports: ['Card'],
    children: {
      render: () => [<Card>一</Card>, <Card>二</Card>, <Card>三</Card>, <Card>四</Card>],
      code: '<Card>一</Card>\n<Card>二</Card>\n<Card>三</Card>\n<Card>四</Card>',
    },
  },
  Container: { children: paragraph },
  Prose: { children: paragraph },
  ScrollArea: { children: paragraph.repeat(8) },
  Card: { children: paragraph },
  Avatar: { initial: { name: '张三' } },
  AvatarGroup: {
    imports: ['Avatar'],
    children: {
      render: () => [<Avatar name="张三" />, <Avatar name="李四" />, <Avatar name="王五" />],
      code: '<Avatar name="张三" />\n<Avatar name="李四" />\n<Avatar name="王五" />',
    },
  },
  Accordion: {
    imports: ['AccordionItem'],
    children: {
      render: () => [
        <AccordionItem value="a" title="怎么安装？">
          pnpm add @zerodep-dev/vue-tsx-pro-ui
        </AccordionItem>,
        <AccordionItem value="b" title="支持暗色吗？">
          支持，三套内置主题。
        </AccordionItem>,
      ],
      code: '<AccordionItem value="a" title="怎么安装？">\n  pnpm add @zerodep-dev/vue-tsx-pro-ui\n</AccordionItem>\n<AccordionItem value="b" title="支持暗色吗？">\n  支持，三套内置主题。\n</AccordionItem>',
    },
  },
  Collapse: { initial: { _open: true }, children: paragraph },
  Collapsible: { fixed: { trigger: triggerButton('展开') }, children: paragraph },
  AnimatedNumber: { initial: { value: 12_345 } },
  Stat: {
    initial: { value: 12_345 },
    fixed: { label: { value: '本月访问', code: '"本月访问"' } },
  },
  Descriptions: {
    fixed: {
      items: {
        value: [
          { label: '姓名', value: '张三' },
          { label: '城市', value: '上海' },
          { label: '电话', value: '138 0000 0000' },
        ],
        code: `{[\n  { label: '姓名', value: '张三' },\n  { label: '城市', value: '上海' },\n  { label: '电话', value: '138 0000 0000' },\n]}`,
      },
    },
  },
  Timeline: {
    fixed: {
      items: {
        value: [
          { title: '下单', time: '10:00' },
          { title: '发货', time: '14:30' },
          { title: '签收', time: '次日 09:12' },
        ],
        code: `{[\n  { title: '下单', time: '10:00' },\n  { title: '发货', time: '14:30' },\n  { title: '签收', time: '次日 09:12' },\n]}`,
      },
    },
  },
  FieldCompare: {
    fixed: {
      fields: {
        value: [
          { key: 'price', header: '单价', type: 'currency', better: 'lower' },
          { key: 'quantity', header: '数量' },
          { key: 'supplier', header: '供应商' },
        ],
        code: `{[\n  { key: 'price', header: '单价', type: 'currency', better: 'lower' },\n  { key: 'quantity', header: '数量' },\n  { key: 'supplier', header: '供应商' },\n]}`,
      },
      before: {
        value: { price: 120, quantity: 10, supplier: '华辰' },
        code: `{{ price: 120, quantity: 10, supplier: '华辰' }}`,
      },
      after: {
        value: { price: 108, quantity: 12, supplier: '恒远' },
        code: `{{ price: 108, quantity: 12, supplier: '恒远' }}`,
      },
    },
  },
  Marquee: {
    imports: ['Tag'],
    children: {
      render: () => ['Vue', 'TSX', 'StyleX', 'Vite', 'TypeScript'].map((name) => <Tag>{name}</Tag>),
      code: "{['Vue', 'TSX', 'StyleX', 'Vite', 'TypeScript'].map((name) => <Tag>{name}</Tag>)}",
    },
  },
  Alert: { children: '保存成功，修改已生效。' },
  Empty: {},
  Result: {},
  Progress: { initial: { value: 60 } },
  Skeleton: { initial: { loading: true }, children: paragraph },
  LoadingOverlay: {
    initial: { loading: true },
    imports: ['Card'],
    children: {
      render: () => <Card>{paragraph}</Card>,
      code: `<Card>${paragraph}</Card>`,
    },
  },
  Dialog: { fixed: { title: { value: '对话框', code: '"对话框"' } }, children: paragraph },
  AlertDialog: {
    fixed: { title: { value: '删除这一项？', code: '"删除这一项？"' } },
    children: '删除后不能恢复。',
  },
  Drawer: { fixed: { title: { value: '抽屉', code: '"抽屉"' } }, children: paragraph },
  Popover: {
    imports: ['Button'],
    fixed: { trigger: triggerButton('打开弹出层') },
    children: paragraph,
  },
  HoverCard: {
    imports: ['Button'],
    fixed: { trigger: triggerButton('悬停查看') },
    children: paragraph,
  },
  Tooltip: {
    imports: ['Button'],
    fixed: { trigger: triggerButton('悬停提示') },
    children: '一句简短的说明',
  },
  Menu: {
    imports: ['Button', 'MenuItem'],
    fixed: { trigger: triggerButton('操作') },
    children: {
      render: () => [
        <MenuItem>编辑</MenuItem>,
        <MenuItem>复制</MenuItem>,
        <MenuItem>删除</MenuItem>,
      ],
      code: '<MenuItem>编辑</MenuItem>\n<MenuItem>复制</MenuItem>\n<MenuItem>删除</MenuItem>',
    },
  },
  Breadcrumbs: {
    fixed: {
      items: {
        value: [{ label: '首页', href: '#' }, { label: '组件', href: '#' }, { label: '按钮' }],
        code: `{[{ label: '首页', href: '#' }, { label: '组件', href: '#' }, { label: '按钮' }]}`,
      },
    },
  },
  Steps: { initial: { _current: 1 }, fixed: { items: { value: steps, code: stepsCode } } },
  Pagination: { initial: { pageCount: 10 } },
  PageJump: { initial: { pageCount: 10 } },
  PaginationBar: { initial: { total: 320 } },
  Tabs: {
    imports: ['Tab', 'TabList', 'TabPanel'],
    initial: { _value: 'a' },
    children: {
      render: () => [
        <TabList aria-label="示例">
          <Tab value="a">概览</Tab>
          <Tab value="b">设置</Tab>
        </TabList>,
        <TabPanel value="a">概览的内容</TabPanel>,
        <TabPanel value="b">设置的内容</TabPanel>,
      ],
      code: '<TabList aria-label="示例">\n  <Tab value="a">概览</Tab>\n  <Tab value="b">设置</Tab>\n</TabList>\n<TabPanel value="a">概览的内容</TabPanel>\n<TabPanel value="b">设置的内容</TabPanel>',
    },
  },
  Toolbar: {
    imports: ['IconButton'],
    icons: ['Plus', 'Settings'],
    children: {
      render: () => [
        <IconButton icon={Plus} aria-label="新建" />,
        <IconButton icon={Settings} aria-label="设置" />,
      ],
      code: '<IconButton icon={Plus} aria-label="新建" />\n<IconButton icon={Settings} aria-label="设置" />',
    },
  },

  Checkbox: { children: '同意用户协议' },
  CheckboxGroup: {
    imports: ['Checkbox'],
    children: {
      render: () => [<Checkbox value="a">邮件</Checkbox>, <Checkbox value="b">短信</Checkbox>],
      code: '<Checkbox value="a">邮件</Checkbox>\n<Checkbox value="b">短信</Checkbox>',
    },
  },
  RadioGroup: {
    imports: ['Radio'],
    children: {
      render: () => [<Radio value="a">按月</Radio>, <Radio value="b">按年</Radio>],
      code: '<Radio value="a">按月</Radio>\n<Radio value="b">按年</Radio>',
    },
  },
  Switch: { children: '接收通知' },
  ToggleGroup: {
    imports: ['ToggleItem'],
    initial: { _value: 'day' },
    children: {
      render: () => [
        <ToggleItem value="day">日</ToggleItem>,
        <ToggleItem value="week">周</ToggleItem>,
        <ToggleItem value="month">月</ToggleItem>,
      ],
      code: '<ToggleItem value="day">日</ToggleItem>\n<ToggleItem value="week">周</ToggleItem>\n<ToggleItem value="month">月</ToggleItem>',
    },
  },
  Select: { fixed: { items: options } },
  Combobox: { fixed: { items: options } },
  Listbox: { fixed: { items: options } },
  TextField: { initial: { placeholder: '请输入' } },
  Textarea: { initial: { placeholder: '请输入' } },
  CharacterCount: { initial: { count: 12, max: 50 } },
  Field: {
    fixed: { label: { value: '邮箱', code: '"邮箱"' } },
    imports: ['TextField'],
    children: { render: () => <TextField />, code: '<TextField />' },
  },
  Label: { children: '邮箱' },
  Separator: {},
};
