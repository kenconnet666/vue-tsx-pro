/**
 * 数据导入：上传文件 → 对应列 → 逐行校验与预览（有错的格子就地改）→ 确认导入。批量导入零件、报价、人员这类数据用它。
 *
 *   <DataImport
 *     fields={[{ key: 'part', label: '零件号', required: true, aliases: ['料号'] }, { key: 'quantity', label: '数量', type: 'number' }]}
 *     schema={z.object({ part: z.string().min(1), quantity: z.number().int().positive() })}
 *     parse={readXlsx}                 // 读 Excel：@vue-tsx-pro/ui/xlsx；不写时读 CSV
 *     accept=".xlsx,.csv"
 *     onImport={(rows) => api.importParts(rows)}
 *   />
 *
 * - 上传：选文件或拖进来，parse 读成表（SheetTable）；几张工作表时先选一张。
 * - 对应列：按字段的 label 与 aliases 自动对上文件里的列，可以改；必填的字段没对上时不能往下走。
 * - 校验：空的格子（空字符串、只有空白）是 null，同 useForm 的约定（选填的字段在 schema 里写 .nullable()）。
 *   有 schema（zod 对象）时逐行解析，错误标在对应的格子上；没有时按 required、type（数字列要是数字）检查，
 *   也可以写 validate。有错的格子可以直接改（表格就地编辑），改完重新校验；“只看有错的行”筛出要处理的。
 * - 导入：onImport 拿到通过校验的行（schema 解析后的值）；返回 Promise 时按钮加载中，完成后显示结果。
 *
 * 部件：Root（div）、Steps、Drop（FileDrop）、Mapping（ColumnTable）、Preview（DataTable）、Actions（Flex）。
 */
import { CircleAlert, CircleCheck, Download } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { shallowRef, type VNodeChild } from 'vue';
import type { $ZodType } from 'zod/v4/core';
import { safeParse } from 'zod/v4/core';
import { Badge } from '../base/Badge';
import { Button, type ButtonProps } from '../base/Button';
import { Icon } from '../base/Icon';
import { Small } from '../base/Text';
import { useLang } from '../config/context';
import { useMessages } from '../config/lang/messages';
import { Alert } from '../feedback/Alert';
import { FileDrop, type FileDropProps } from '../input/FileDrop';
import { Select } from '../input/Select';
import { Switch } from '../input/Switch';
import { Flex, type FlexProps } from '../layout/Flex';
import { Steps, type StepsProps } from '../navigation/Steps';
import type { DataTableColumn } from '../table/columns';
import { ColumnTable } from '../table/ColumnTable';
import { DataTable, type DataTableProps } from '../table/DataTable';
import { readCsvFile, type SheetTable, type SheetValue } from '../table/sheet';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { patternsMessages } from './messages';

/** 要导入的一个字段 */
export interface ImportField {
  /** 字段名：导入的行里的键 */
  key: string;
  /** 名称：对应列时显示，也用来自动对上文件里的同名列 */
  label: string;
  /** 必填：没对应上不能往下走；没有 schema 时空值算错 */
  required?: boolean;
  /** 文件里这一列可能的其他叫法（“料号”“Part No.”）：自动对应时也认 */
  aliases?: readonly string[];
  /** 值的类型（没有 schema 时）：number 把文字转成数字，转不了算错；默认 text */
  type?: 'text' | 'number';
  /** 预览表里这一列的宽度（px） */
  width?: number;
}

/** 预览里的一行 */
interface ImportRow {
  /** 第几行数据（从 1 起） */
  line: number;
  /** 对应后的原值（字段名 → 值），就地改的是它 */
  raw: Record<string, unknown>;
  /** 校验通过后的值 */
  value?: unknown;
  /** 字段名 → 原因 */
  errors: Record<string, string>;
}

/** 未声明的属性落到外层 div 上 */
export interface DataImportProps<Row> extends PartProps<'div'> {
  /** 要导入的字段，按显示的顺序 */
  fields: readonly ImportField[];
  /** 一行的 zod 对象 schema：逐行解析，错误标在格子上，onImport 拿到解析后的值 */
  schema?: $ZodType<Row>;
  /** 没有 schema 时的逐行校验：返回字段名 → 原因（在 required、type 的检查之后） */
  validate?: (row: Record<string, unknown>) => Record<string, string> | null | undefined;
  /** 读文件：返回各工作表；默认读 CSV（readCsvFile），读 Excel 传 @vue-tsx-pro/ui/xlsx 的 readXlsx */
  parse?: (file: File) => Promise<SheetTable[]>;
  /** 能选的文件类型，默认 .csv */
  accept?: string;
  /** 导入通过校验的行：返回 Promise 时按钮加载中，失败时留在预览（由调用方提示原因） */
  onImport: (rows: Row[]) => unknown;
  /** 下载模板：写了就在上传区旁边放“下载模板” */
  onTemplate?: () => void;
  /** 步骤条的部件属性 */
  propsSteps?: Partial<StepsProps>;
  /** 选文件区域的部件属性 */
  propsDrop?: Partial<FileDropProps>;
  /** 预览表（DataTable）的部件属性 */
  propsPreview?: Partial<DataTableProps<ImportRow>>;
  /** 按钮行的部件属性 */
  propsActions?: Partial<FlexProps>;
  /** 导入按钮的部件属性 */
  propsSubmit?: Partial<ButtonProps>;
}

/** DataImport 的样式：root、previewTable、validIcon、invalidIcon */
export const dataImportStyles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_lg', minWidth: 0 },
  previewTable: { maxHeight: '24rem' },
  validIcon: { color: '_successText' },
  invalidIcon: { color: '_dangerText' },
});

/** 文字规范化后比较：去掉空白、括号与大小写（“零件号 (必填)”也认作“零件号”） */
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s_*]/g, '');

/** 按名称与别名对上文件里的列 */
function autoMap(
  fields: readonly ImportField[],
  headers: readonly string[],
): Record<string, string | null> {
  const taken = new Set<string>();
  return Object.fromEntries(
    fields.map((field) => {
      const names = [field.label, field.key, ...(field.aliases ?? [])].map(normalize);
      const header = headers.find((item) => !taken.has(item) && names.includes(normalize(item)));
      if (header) taken.add(header);
      return [field.key, header ?? null];
    }),
  );
}

/** 空值：null、空字符串 */
const isEmpty = (value: unknown) =>
  value == null || (typeof value === 'string' && value.trim() === '');

/** 数据导入：上传 → 对应列 → 校验与预览 → 导入 */
export const DataImport = _component(
  <Row,>({
    fields,
    schema,
    validate,
    parse = readCsvFile,
    accept = '.csv',
    onImport,
    onTemplate,
    propsSteps,
    propsDrop,
    propsPreview,
    propsActions,
    propsSubmit,
    ...rest
  }: DataImportProps<Row>) => {
    const messages = useMessages('patterns', patternsMessages);
    const lang = useLang();
    let step = _state(0);
    let sheets = _state.raw<SheetTable[]>([]);
    let sheetName = _state<string | null>(null);
    let mapping = _state<Record<string, string | null>>({});
    let parseError = _state('');
    let onlyErrors = _state(false);
    let importing = _state(false);
    let imported = _state(0);
    // 预览的行：就地改时整个换掉
    const rows = shallowRef<ImportRow[]>([]);

    const sheet = () => sheets.find((item) => item.name === sheetName);
    const unmapped = () =>
      fields.filter((field) => field.required && !mapping[field.key]).map((field) => field.label);

    async function onFiles(files: File[]) {
      const file = files[0];
      if (!file) return;
      parseError = '';
      try {
        const read = (await parse(file)).filter((item) => item.rows.length > 0);
        if (read.length === 0) {
          parseError = messages.dataImportEmpty;
          return;
        }
        sheets = read;
        sheetName = read[0]!.name;
        mapping = autoMap(fields, read[0]!.headers);
        step = 1;
      } catch (error) {
        parseError = messages.dataImportParseFailed(
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    function changeSheet(name: string | null) {
      sheetName = name;
      const current = sheet();
      if (current) mapping = autoMap(fields, current.headers);
    }

    /** 校验一行：schema 优先；否则 required、type 与 validate */
    function check(raw: Record<string, unknown>): Pick<ImportRow, 'value' | 'errors'> {
      if (schema) {
        const result = safeParse(schema, raw);
        if (result.success) return { value: result.data, errors: {} };
        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = String(issue.path[0] ?? fields[0]?.key ?? '');
          errors[key] ??= issue.message;
        }
        return { errors };
      }
      const errors: Record<string, string> = {};
      const value: Record<string, unknown> = {};
      for (const field of fields) {
        const cell = raw[field.key];
        if (isEmpty(cell)) {
          if (field.required) errors[field.key] = lang.formRequired;
          value[field.key] = null;
        } else if (field.type === 'number') {
          const number = typeof cell === 'number' ? cell : Number(String(cell).replace(/,/g, ''));
          if (Number.isNaN(number)) errors[field.key] = messages.dataImportNotNumber;
          value[field.key] = number;
        } else value[field.key] = typeof cell === 'string' ? cell.trim() : cell;
      }
      Object.assign(errors, { ...validate?.(value), ...errors });
      return Object.keys(errors).length ? { errors } : { value, errors };
    }

    /** 对应完：按对应关系取出各行并校验，进入预览 */
    function preview() {
      const current = sheet();
      if (!current) return;
      rows.value = current.rows.map((row, index) => {
        const raw = Object.fromEntries(
          fields.map((field) => {
            const header = mapping[field.key];
            const value = header ? (row[header] ?? null) : null;
            return [field.key, isEmpty(value) ? null : value] as [string, SheetValue];
          }),
        );
        return { line: index + 1, raw, ...check(raw) };
      });
      onlyErrors = false;
      step = 2;
    }

    /** 就地改了一格：改原值、重新校验这一行 */
    function onCellChange(row: ImportRow, key: string, value: unknown) {
      rows.value = rows.value.map((item) => {
        if (item !== row) return item;
        const raw = { ...item.raw, [key]: isEmpty(value) ? null : value };
        return { ...item, raw, ...check(raw) };
      });
    }

    async function submit() {
      const valid = rows.value.filter((row) => Object.keys(row.errors).length === 0);
      importing = true;
      try {
        await onImport(valid.map((row) => row.value as Row));
        imported = valid.length;
        step = 3;
      } catch (error) {
        console.error('DataImport 的 onImport 失败，留在预览', error);
      } finally {
        importing = false;
      }
    }

    function restart() {
      sheets = [];
      sheetName = null;
      rows.value = [];
      step = 0;
    }

    const counts = () => {
      const invalid = rows.value.filter((row) => Object.keys(row.errors).length > 0).length;
      return { total: rows.value.length, invalid, valid: rows.value.length - invalid };
    };

    const previewColumns = (): DataTableColumn<ImportRow>[] => [
      { key: 'line', header: messages.dataImportRow, width: 72, value: (row) => row.line },
      {
        key: 'status',
        header: messages.dataImportStatus,
        width: 200,
        cell: (row) => {
          const first = Object.values(row.errors)[0];
          return first ? (
            <Flex align="center" gap="xs">
              <Icon icon={CircleAlert} sx={dataImportStyles.invalidIcon} />
              <Small tone="danger">{first}</Small>
            </Flex>
          ) : (
            <Flex align="center" gap="xs">
              <Icon icon={CircleCheck} sx={dataImportStyles.validIcon} />
              <Small tone="muted">{messages.dataImportValid}</Small>
            </Flex>
          );
        },
      },
      ...fields.map((field): DataTableColumn<ImportRow> => ({
        key: field.key,
        header: field.label,
        width: field.width,
        minWidth: 120,
        type: field.type === 'number' ? 'number' : 'text',
        value: (row) => row.raw[field.key] as SheetValue,
        editable: true,
      })),
    ];

    function renderUpload(): VNodeChild {
      return (
        <Flex direction="column" gap="sm">
          <FileDrop
            {...mergePartProps<FileDropProps>(
              { accept, description: messages.dataImportAccept(accept.split(',').join(', ')) },
              propsDrop,
              { onFiles: (files: File[]) => void onFiles(files) },
            )}
          />
          {parseError && <Alert tone="danger">{parseError}</Alert>}
          {onTemplate && (
            <Flex justify="end">
              <Button size="sm" variant="ghost" icon={Download} onClick={onTemplate}>
                {messages.dataImportTemplate}
              </Button>
            </Flex>
          )}
        </Flex>
      );
    }

    function renderMapping(): VNodeChild {
      const current = sheet();
      const headers = current?.headers ?? [];
      const missing = unmapped();
      const sampleOf = (header: string | null) =>
        header
          ? (current?.rows ?? [])
              .slice(0, 2)
              .map((row) => row[header])
              .filter((value) => !isEmpty(value))
              .map(String)
              .join('、')
          : '';
      return (
        <Flex direction="column" gap="md">
          {sheets.length > 1 && (
            <Flex align="center" gap="sm">
              <Small tone="muted">{messages.dataImportSheet}</Small>
              <Select
                items={sheets.map((item) => item.name)}
                value={sheetName}
                {...{ 'onUpdate:value': changeSheet }}
                aria-label={messages.dataImportSheet}
                size="sm"
              />
            </Flex>
          )}
          <ColumnTable
            rows={fields}
            getKey={(field) => field.key}
            aria-label={messages.dataImportSteps[1]}
            columns={[
              {
                key: 'label',
                header: messages.dataImportField,
                cell: (field) => (
                  <Flex align="center" gap="xs">
                    {field.label}
                    {field.required && <Badge tone="danger">*</Badge>}
                  </Flex>
                ),
              },
              {
                key: 'column',
                header: messages.dataImportColumn,
                width: 240,
                cell: (field) => (
                  <Select
                    items={headers}
                    value={mapping[field.key] ?? null}
                    {...{
                      'onUpdate:value': (header: string | null) =>
                        (mapping = { ...mapping, [field.key]: header }),
                    }}
                    placeholder={messages.dataImportSkip}
                    clearable
                    size="sm"
                    aria-label={`${field.label}：${messages.dataImportColumn}`}
                  />
                ),
              },
              {
                key: 'sample',
                header: messages.dataImportSample,
                cell: (field) => <Small tone="muted">{sampleOf(mapping[field.key] ?? null)}</Small>,
              },
            ]}
          />
          {missing.length > 0 && (
            <Alert tone="warning">{messages.dataImportUnmapped(missing)}</Alert>
          )}
        </Flex>
      );
    }

    function renderPreview(): VNodeChild {
      const { total, valid, invalid } = counts();
      const shown = onlyErrors
        ? rows.value.filter((row) => Object.keys(row.errors).length > 0)
        : rows.value;
      return (
        <Flex direction="column" gap="sm">
          <Flex align="center" justify="between" gap="md" wrap>
            <Small>{messages.dataImportSummary(total, valid, invalid)}</Small>
            {invalid > 0 && (
              <Switch
                checked={onlyErrors}
                {...{ 'onUpdate:checked': (value: boolean) => (onlyErrors = value) }}
              >
                {messages.dataImportOnlyErrors}
              </Switch>
            )}
          </Flex>
          <DataTable
            {...mergePartProps<Partial<DataTableProps<ImportRow>>>(
              {
                'aria-label': messages.dataImportPreview,
                propsRoot: { sx: dataImportStyles.previewTable },
                density: 'compact',
              },
              propsPreview,
            )}
            rows={shown}
            columns={previewColumns()}
            getKey={(row) => String(row.line)}
            rowTone={(row) => (Object.keys(row.errors).length ? 'danger' : undefined)}
            validateRow={(row) => row.errors}
            onCellChange={onCellChange}
          />
          {invalid > 0 && <Small tone="muted">{messages.dataImportEditHint}</Small>}
        </Flex>
      );
    }

    return () => {
      const { valid } = counts();
      return (
        <div {...mergeAttrs<'div'>({ sx: dataImportStyles.root }, rest)}>
          <Steps
            {...mergePartProps<StepsProps>(
              { items: messages.dataImportSteps.map((title) => ({ title })) },
              propsSteps,
              { items: messages.dataImportSteps.map((title) => ({ title })) },
            )}
            current={step}
          />
          {step === 0 && renderUpload()}
          {step === 1 && renderMapping()}
          {step === 2 && renderPreview()}
          {step === 3 && (
            <Alert tone="success" title={messages.dataImportDone(imported)}>
              <Button size="sm" variant="soft" onClick={restart}>
                {messages.dataImportAgain}
              </Button>
            </Alert>
          )}
          {(step === 1 || step === 2) && (
            <Flex {...mergePartProps<FlexProps>({ justify: 'end', gap: 'sm' }, propsActions)}>
              <Button
                variant="ghost"
                tone="neutral"
                onClick={() => (step === 1 ? restart() : (step = 1))}
              >
                {messages.stepsFormPrevious}
              </Button>
              {step === 1 ? (
                <Button disabled={unmapped().length > 0} onClick={preview}>
                  {messages.stepsFormNext}
                </Button>
              ) : (
                <Button
                  {...mergePartProps<ButtonProps>({}, propsSubmit, {
                    disabled: valid === 0,
                    loading: importing,
                    onClick: () => void submit(),
                  })}
                >
                  {messages.dataImportSubmit(valid)}
                </Button>
              )}
            </Flex>
          )}
        </div>
      );
    };
  },
);
