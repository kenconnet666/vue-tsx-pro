/** 指南：选组件。按要做的事分组，每一行是“想要什么 → 用哪个 → 和相近的组件差在哪” */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  ColumnTable,
  Flex,
  H2,
  Link,
  Paragraph,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../site/DocPage';

const meta = {
  title: 'Choosing 选组件',
  description:
    '按要做的事找组件：从选项里选、输入、浮层、反馈、展示数据、布局与导航，每一行写清楚和相近的组件差在哪。',
};

/** 一行：想要什么、用哪个（名称 → 页面地址）、怎么区分 */
interface Choice {
  need: string;
  use: readonly [name: string, path: string][];
  note: string;
}

const columns: DataTableColumn<Choice>[] = [
  { key: 'need', header: '想要', width: 220, wrap: true },
  {
    key: 'use',
    header: '用',
    width: 200,
    cell: (choice) => (
      <Flex gap="xs" wrap>
        {choice.use.map(([name, path]) => (
          <Link key={name} href={`/components/${path}`}>
            {name}
          </Link>
        ))}
      </Flex>
    ),
  },
  { key: 'note', header: '怎么区分', wrap: true },
];

const sections: { id: string; title: string; intro: string; rows: Choice[] }[] = [
  {
    id: 'pick',
    title: '从选项里选',
    intro: '先看选项有多少、要不要一眼都看见、能不能自己输入。',
    rows: [
      {
        need: '几个选项都要一眼看见（5 个以内）',
        use: [['RadioGroup、CheckboxGroup', 'checkbox']],
        note: '单选用 RadioGroup，多选用 CheckboxGroup；要整块可点、带说明时加 card。',
      },
      {
        need: '点开一列选一个或几个',
        use: [['Select', 'select']],
        note: '同原生 select；选项多时 searchable，远程的给 load（可以分页）。',
      },
      {
        need: '边输入边筛选，也能输入列表里没有的',
        use: [['Combobox', 'combobox']],
        note: 'Select 只能选列表里有的；Combobox 的值就是输入框里的文字。',
      },
      {
        need: '输入为主，顺带给几条建议',
        use: [['Autocomplete', 'autocomplete']],
        note: '建议只是帮着补全，不要求选中其中一项。',
      },
      {
        need: '选项平铺在页面上（不弹出）',
        use: [['Listbox', 'listbox']],
        note: 'Select、Combobox 弹出的就是它；放在侧栏、对话框里一直显示时直接用。',
      },
      {
        need: '切换视图、对齐方式这类分段按钮',
        use: [['ToggleGroup', 'toggle-group']],
        note: '值立刻生效、不是表单里的选择时用它；表单里的单选用 RadioGroup。',
      },
      {
        need: '在一棵树里选（部门、分类）',
        use: [
          ['TreeSelect', 'tree-select'],
          ['Cascader', 'cascader'],
        ],
        note: 'TreeSelect 一次看到整棵树、可以多选；Cascader 一列一列往下（省市区），只选一条路径。',
      },
      {
        need: '从一大批里挑出一部分',
        use: [['Transfer', 'transfer']],
        note: '两栏对着看“候选”和“已选”，适合几十上千项。',
      },
      {
        need: '输入多个标签、选人、@ 提到人',
        use: [
          ['TagsInput', 'tags-input'],
          ['PeoplePicker', 'people-picker'],
          ['Mentions', 'mentions'],
        ],
        note: 'TagsInput 的值是文字；PeoplePicker 带头像、按组织找人；Mentions 在一段文字里插入提及。',
      },
      {
        need: '筛选条件的一排可选标签',
        use: [['Tag（_selected）', 'badge']],
        note: '每个标签是按下 / 抬起的按钮（aria-pressed），比一排复选框紧凑。',
      },
    ],
  },
  {
    id: 'input',
    title: '输入',
    intro: '按值的类型挑输入框；整张表单用 Form，弹窗里的用 FormDialog。',
    rows: [
      {
        need: '文字、多行文字',
        use: [['TextField、Textarea', 'text-field']],
        note: '字数限制用 CharacterCount；只读展示用 Text，不要用禁用的输入框。',
      },
      {
        need: '数字、金额、区间',
        use: [['NumberField', 'number-field']],
        note: '步进、千分位、Decimal 精确值；区间用 NumberRangeField。',
      },
      {
        need: '日期、时间',
        use: [
          ['DatePicker', 'date-picker'],
          ['DateField', 'date-field'],
          ['TimePicker', 'time-picker'],
        ],
        note: 'DatePicker 带日历弹层；DateField 是一段一段键盘输入；范围用 DateRangePicker。',
      },
      {
        need: '验证码、颜色、评分、滑块',
        use: [
          ['OtpField', 'otp-field'],
          ['ColorField', 'color-field'],
          ['Rating', 'rating'],
          ['Slider', 'slider'],
        ],
        note: '颜色要平铺的面板（主题编辑器）时用 ColorPicker；ColorField 点色块弹出的就是它。',
      },
      {
        need: '文件、图片、签名',
        use: [
          ['Upload', 'upload'],
          ['ImageCropper', 'image-cropper'],
          ['SignaturePad', 'signature-pad'],
        ],
        note: 'Upload 管列表与上传；只要选文件的拖放区用 FileDrop；上传前裁剪用 transform 弹出 ImageCropper。',
      },
      {
        need: '整张表单、分步、弹窗里的表单',
        use: [
          ['Form', 'form'],
          ['StepsForm', 'steps-form'],
          ['FormDialog', 'form-dialog'],
        ],
        note: 'Field 给每个输入框标签、说明与错误；useForm 管值、校验与提交。',
      },
      {
        need: '列表页的查询条件、复杂的条件组合',
        use: [
          ['FilterBar', 'filter-bar'],
          ['QueryTable', 'query-table'],
          ['ConditionBuilder', 'condition-builder'],
        ],
        note: 'QueryTable 是查询栏加表格加分页的整页组合；“且 / 或”嵌套的条件用 ConditionBuilder。',
      },
    ],
  },
  {
    id: 'overlay',
    title: '浮层',
    intro: '浮层越重，打断越多：能放在页面里的就别弹出来。',
    rows: [
      {
        need: '必须先处理完的任务、要确认的操作',
        use: [
          ['Dialog', 'dialog'],
          ['Popconfirm', 'popconfirm'],
        ],
        note: 'Dialog 模态、挡住页面；删除一行这类轻的确认用 Popconfirm，贴在按钮旁边。',
      },
      {
        need: '不离开页面看详情、填一张表',
        use: [['Drawer', 'drawer']],
        note: '从一侧滑出，页面还看得见；内容很多、要并排对照时比 Dialog 合适。',
      },
      {
        need: '按钮旁边的小表单、筛选、悬停说明',
        use: [['Popover、Tooltip、HoverCard', 'popover']],
        note: 'Popover 点开、里面能操作；Tooltip 只是一句说明；HoverCard 悬停预览（人员卡片、链接）。',
      },
      {
        need: '一列操作、右键菜单、命令面板',
        use: [
          ['Menu、ContextMenu', 'menu'],
          ['CommandPalette', 'command-palette'],
        ],
        note: 'Menu 里是操作，不是导航；Ctrl + K 搜功能、搜页面用 CommandPalette。',
      },
      {
        need: '新功能的分步引导',
        use: [['Tour', 'tour']],
        note: '一步一步高亮页面上的元素；只有一句话的提示用 Tooltip 或 Alert。',
      },
    ],
  },
  {
    id: 'feedback',
    title: '反馈',
    intro: '操作的结果、页面的状态、等待。',
    rows: [
      {
        need: '操作的结果（已保存、已删除）',
        use: [['Toast', 'toast']],
        note: '几秒后自己消失，可以带“撤销”；必须看到的错误别只用 Toast。',
      },
      {
        need: '页面里一直留着的提示',
        use: [['Alert', 'alert']],
        note: '说明、警告、表单整体的错误；跟着内容放，不浮在上面。',
      },
      {
        need: '加载中',
        use: [
          ['Skeleton', 'skeleton'],
          ['Progress、Spinner', 'progress'],
        ],
        note: '内容的形状已知时用骨架；知道进度用 Progress；按钮里的等待用 Button 的 loading。',
      },
      {
        need: '没有数据、一块出错、滚动加载的结尾',
        use: [
          ['Empty', 'empty'],
          ['ErrorBoundary', 'error-boundary'],
          ['VirtualList（InfiniteListStatus）', 'virtual-list'],
        ],
        note: '列表、表格自带空状态；ErrorBoundary 只换掉出错的那一块；滚动加载的“没有更多了”与重试用 InfiniteListStatus。',
      },
    ],
  },
  {
    id: 'data',
    title: '展示数据',
    intro: '先看数据量与要不要交互。',
    rows: [
      {
        need: '大量数据：排序、筛选、勾选、编辑',
        use: [['DataTable', 'data-table']],
        note: '行（必要时列）都虚拟滚动；有层级的用 TreeDataTable；交叉汇总用 PivotTable。',
      },
      {
        need: '小表、打印、合并单元格',
        use: [['Table、ColumnTable', 'table']],
        note: '静态渲染、列宽按内容、单元格可以换行；ColumnTable 按列定义生成。',
      },
      {
        need: '一条记录的各个字段、改了哪些',
        use: [
          ['Descriptions', 'descriptions'],
          ['FieldCompare', 'field-compare'],
        ],
        note: 'Descriptions 是详情页的“标签：值”；审批、变更记录里对照新旧用 FieldCompare。',
      },
      {
        need: '一列条目（头像、标题、操作）、很长的列表',
        use: [
          ['ItemList', 'item-list'],
          ['VirtualList', 'virtual-list'],
        ],
        note: 'ItemList 的行整条可点、带开头与结尾；上万条、行的样子自己画时用 VirtualList。',
      },
      {
        need: '层级、原始 JSON',
        use: [
          ['Tree', 'tree'],
          ['JsonViewer', 'json-viewer'],
        ],
        note: 'Tree 可选、可勾、可拖；看接口返回、配置原样的数据用 JsonViewer。',
      },
      {
        need: '指标、过程、清单',
        use: [
          ['Stat', 'stat'],
          ['Timeline', 'timeline'],
          ['Checklist', 'checklist'],
        ],
        note: '一组数字用 Stat（可带趋势小图）；审批、物流记录用 Timeline；待办与完成情况用 Checklist。',
      },
    ],
  },
  {
    id: 'layout',
    title: '布局与导航',
    intro: '页面骨架、分栏、切换与跳转。',
    rows: [
      {
        need: '排一排、排成网格',
        use: [['Flex、Grid', 'flex']],
        note: 'Grid 的 minItemWidth 按宽度自动分列，balanced 时最后一行不落单。',
      },
      {
        need: '整个应用的框架、侧栏加内容、可拖动的分栏',
        use: [
          ['AppShell', 'app-shell'],
          ['AsideLayout', 'aside-layout'],
          ['Splitter', 'splitter'],
        ],
        note: 'AppShell 是顶栏、侧边导航与内容区；页面里的侧栏用 AsideLayout；能拖动宽度的用 Splitter。',
      },
      {
        need: '分块、折叠、标签页',
        use: [
          ['Card', 'card'],
          ['Accordion', 'accordion'],
          ['Tabs', 'tabs'],
        ],
        note: 'Tabs 切的是同一层级的几块内容；一次能展开好几块、可以都收起时用 Accordion。',
      },
      {
        need: '侧边导航、面包屑、分页、工具栏',
        use: [
          ['NavList', 'nav-list'],
          ['Breadcrumbs', 'breadcrumbs'],
          ['Pagination', 'pagination'],
          ['Toolbar', 'toolbar'],
        ],
        note: '底部固定的保存栏用 ActionBar；页面角落的常驻操作用 FloatButton。',
      },
    ],
  },
];

export default _component(() => () => (
  <DocPage meta={meta}>
    <Paragraph>
      {
        '相近的组件常常都能用，差别在交互的轻重、数据量、要不要一眼看见。下面按要做的事分组，每一行写清楚和相近的组件差在哪；拿不准时先选更轻的那个。'
      }
    </Paragraph>
    {sections.map((section) => (
      <Flex key={section.id} direction="column" gap="md">
        <H2 id={section.id} size="xl" anchor>
          {section.title}
        </H2>
        <Paragraph>{section.intro}</Paragraph>
        <ColumnTable
          rows={section.rows}
          columns={columns}
          getKey={(row) => row.need}
          aria-label={section.title}
        />
      </Flex>
    ))}
  </DocPage>
));
