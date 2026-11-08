/**
 * 表单设计器（组合）：左边加字段，中间是字段的先后（拖动排序；明细表的列在明细表下面），右边改选中字段的属性（FieldProperties），
 * “预览”页按清单渲染成单据（useFlowForm，同审批时看到的）。改的就是字段清单本身——流程工程里 form.ts 的
 * `defineForm({...})` 字面量，代码与设计器是同一份。清单的问题（模型包的 validateManifest）列在下面，点一下选中那个字段。
 *
 *   <FormDesigner manifest={manifest} onChange={(next) => (manifest = next)} sources={['costCenters']} />
 */
import { Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Alert,
  Badge,
  Button,
  ButtonBase,
  Card,
  Flex,
  ItemList,
  ItemListItem,
  SchemaForm,
  Small,
  Sortable,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  useConfig,
} from '@zerodep-dev/vue-tsx-pro-ui';
import {
  manifestField,
  manifestProblemMessage,
  validateManifest,
  type FieldDefinition,
  type FormManifest,
} from '@zerodep-dev/flow-ts-model';
import { useFlowForm } from '../form/useFlowForm';
import { FieldProperties } from './FieldProperties';
import { FIELD_TYPES, fieldTypeLabel, insertField, orderFields, removeField } from './form-fields';

/** FormDesigner 的属性 */
export interface FormDesignerProps {
  /** 字段清单 */
  manifest: FormManifest;
  /** 清单改了：交回新的清单 */
  onChange: (next: FormManifest) => void;
  /** 能选的字典（createUi 的 formSources.options 里登记的名字）：选择字段的选项可以来自它们 */
  sources?: readonly string[];
}

/** FormDesigner 的样式：三栏（窄时上下排）、字段行、预览 */
const formDesignerStyles = css.create({
  layout: {
    display: 'grid',
    gap: '_md',
    gridTemplateColumns: {
      default: '1fr',
      '@container (min-width: 48rem)': '8rem minmax(0, 1fr) minmax(16rem, 22rem)',
    },
    alignItems: 'start',
  },
  container: { containerType: 'inline-size' },
  palette: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    width: '_full',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    borderRadius: '_md',
    textAlign: 'start',
    backgroundColor: { default: null, ':hover': '_fill' },
  },
  rowSelected: { backgroundColor: '_accentSoft', color: '_accentText' },
  rowLabel: { flexGrow: 1, minWidth: 0 },
  columns: { paddingInlineStart: '_xl' },
});

/** 预览：清单变了就重建表单（useFlowForm 在 setup 里取清单） */
const Preview = _component(({ manifest }: { manifest: FormManifest }) => {
  const config = useConfig();
  const form = useFlowForm({ manifest, isStart: true });
  // 人员字段要有选人的来源：应用没登记时给一个空的，预览不至于报错
  const sources = config.formSources?.people ? {} : { people: { children: async () => [] } };
  return () => <SchemaForm controller={form} columns={2} sources={sources} />;
});

/** 表单设计器 */
export const FormDesigner = _component(
  ({ manifest, onChange, sources = [] }: FormDesignerProps) => {
    let selected = _state<string | null>(Object.keys(manifest)[0] ?? null);
    let tab = _state('design');
    const select = (path: string | null) => (selected = path);

    function add(make: () => FieldDefinition) {
      // 选中的是明细表或它的列时加成列（明细表里不能再放明细表）
      const owner = selected?.split('.')[0];
      const list = owner && manifest[owner]?.type === 'list' ? owner : undefined;
      const field = make();
      const result = insertField(manifest, field, field.type === 'list' ? undefined : list);
      onChange(result.manifest);
      select(result.path);
    }

    function remove(path: string) {
      onChange(removeField(manifest, path));
      if (selected === path || selected?.startsWith(`${path}.`)) select(null);
    }

    /** 字段的一行：名称、类型、必填；点一下选中 */
    const row = (path: string, field: FieldDefinition) => (
      <ButtonBase
        sx={[formDesignerStyles.row, selected === path && formDesignerStyles.rowSelected]}
        aria-pressed={selected === path}
        onClick={() => select(path)}
      >
        <span {...css.attrs(formDesignerStyles.rowLabel)}>{field.label || path}</span>
        {field.required && <Badge tone="danger">必填</Badge>}
        <Small tone="muted">{fieldTypeLabel(field.type)}</Small>
      </ButtonBase>
    );

    function renderList() {
      const names = Object.keys(manifest);
      if (names.length === 0) return <Small tone="muted">从左边加字段。</Small>;
      return (
        <Sortable
          _items={names}
          onUpdate:_items={(next: string[]) => onChange(orderFields(manifest, next))}
          getKey={(name) => name}
          getLabel={(name) => manifest[name]?.label ?? name}
          aria-label="字段"
        >
          {(name: string) => {
            const field = manifest[name]!;
            const columns = field.type === 'list' ? Object.keys(field.fields ?? {}) : [];
            return (
              <Flex direction="column" gap="xs">
                {row(name, field)}
                {field.type === 'list' && (
                  <div {...css.attrs(formDesignerStyles.columns)}>
                    <Sortable
                      _items={columns}
                      onUpdate:_items={(next: string[]) =>
                        onChange(orderFields(manifest, next, name))
                      }
                      getKey={(column) => column}
                      getLabel={(column) => field.fields?.[column]?.label ?? column}
                      aria-label={`“${field.label}”的列`}
                    >
                      {(column: string) => row(`${name}.${column}`, field.fields![column]!)}
                    </Sortable>
                  </div>
                )}
              </Flex>
            );
          }}
        </Sortable>
      );
    }

    return () => {
      const problems = validateManifest(manifest);
      return (
        <Flex direction="column" gap="md">
          <Tabs _value={tab}>
            <TabList aria-label="表单设计器">
              <Tab value="design">设计</Tab>
              <Tab value="preview">预览</Tab>
            </TabList>
            <TabPanel value="design">
              <div {...css.attrs(formDesignerStyles.container)}>
                <div {...css.attrs(formDesignerStyles.layout)}>
                  <div {...css.attrs(formDesignerStyles.palette)} role="group" aria-label="加字段">
                    {FIELD_TYPES.map((item) => (
                      <Button
                        key={item.type}
                        size="sm"
                        variant="soft"
                        icon={Plus}
                        onClick={() => add(item.make)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  <Card padding="sm">{renderList()}</Card>
                  <Card padding="md" header="字段属性">
                    {selected && manifestField(manifest, selected) ? (
                      <FieldProperties
                        key={selected}
                        manifest={manifest}
                        path={selected}
                        sources={sources}
                        onChange={onChange}
                        onRename={select}
                        onRemove={remove}
                      />
                    ) : (
                      <Small tone="muted">选中一个字段在这里改。</Small>
                    )}
                  </Card>
                </div>
              </div>
            </TabPanel>
            <TabPanel value="preview">
              {tab === 'preview' && <Preview key={JSON.stringify(manifest)} manifest={manifest} />}
            </TabPanel>
          </Tabs>
          {problems.length > 0 && (
            <Alert tone="danger" title={`表单还有 ${problems.length} 个问题`}>
              <ItemList density="compact">
                {problems.map((problem, index) => (
                  <ItemListItem
                    key={index}
                    title={manifestProblemMessage(problem, manifest)}
                    onSelect={() => problem.field && select(problem.field)}
                  />
                ))}
              </ItemList>
            </Alert>
          )}
        </Flex>
      );
    };
  },
);
