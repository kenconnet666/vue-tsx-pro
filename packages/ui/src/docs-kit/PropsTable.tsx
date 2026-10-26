/**
 * 组件 API 的表格：一行一个 prop，列出名称、类型、默认值与说明；档位类的 prop 在说明下列出每个可选值的含义。
 * 文档站用它展示从类型与 JSDoc 生成的数据（ComponentApi），也可以手写数据给自己的组件做文档。
 *
 *   <PropsTable props={api.props.filter((prop) => prop.kind === 'prop')} />
 *
 * 必填的 prop 名称旁标“必填”，能 `_bind` 双向绑定的标“可绑定”（文案见 messages.ts）。外层是静态表格 Table，窄屏时横向滚动。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Badge } from '../base/Badge';
import { Code } from '../base/Code';
import { useMessages } from '../config/lang/messages';
import { hasContent, mergeAttrs, mergePartProps } from '../utils/props';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableProps,
} from '../table/Table';
import { docsKitMessages } from './messages';

/** prop 的种类：文档里分开列出 */
export interface ApiPropKinds {
  /** 普通属性：外观、状态、数据 */
  prop: unknown;
  /** 部件属性（propsXxx）：透传给内部的某个部件 */
  part: unknown;
  /** 事件（onXxx） */
  event: unknown;
  /** 内容：children 与渲染函数（renderXxx） */
  content: unknown;
}

/** 档位类 prop 的一个可选值 */
export interface ApiValue {
  /** 取值 */
  value: string;
  /** 这个值的含义；没有注释时为空 */
  description: string;
}

/** 一个 prop 的文档数据 */
export interface ApiProp {
  /** 名称 */
  name: string;
  /** 种类 */
  kind: keyof ApiPropKinds;
  /** 类型（源码里写的样子，如 `keyof ButtonVariants`） */
  type: string;
  /** 必填 */
  required: boolean;
  /** 默认值（源码表达式，如 `'button'`、`false`）；没有时不显示 */
  default?: string;
  /** 能用 `_bind` 双向绑定 */
  bindable?: boolean;
  /** 说明 */
  description: string;
  /** 档位类的可选值与各自的含义 */
  values?: ApiValue[];
}

/** 一个组件的 API 文档数据 */
export interface ComponentApi {
  /** Props 接口的名字 */
  name: string;
  /** 组件名：ButtonProps → Button；泛型组件的 SelectBaseProps → Select */
  component: string;
  /** 接口的说明（如“未声明的属性落到 button 上”） */
  description: string;
  /** 各个 prop */
  props: ApiProp[];
}

/** 未声明的属性落到 table 上 */
export interface PropsTableProps extends TableProps {
  /** 要列出的 prop */
  props: readonly ApiProp[];
  /** 表格标题（caption），同时是表格的名称 */
  caption?: VNodeChild;
}

/** PropsTable 的样式：name、nameCode、head、descriptionCell、type、muted、description、values、valueTerm、valueText */
export const propsTableStyles = css.create({
  name: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '_xs' },
  // 属性名不断开：Code 默认可以在任意位置换行，表格会按它把名称列压到最窄
  nameCode: { whiteSpace: 'nowrap' },
  // 表头都很短，中文会在任意字间断开（“默认 / 值”）
  head: { whiteSpace: 'nowrap' },
  // 说明是最长的一列：至少留出一段可读的宽度，类型再长也不挤掉它
  descriptionCell: { minWidth: '18rem' },
  type: { color: '_codeType' },
  muted: { color: '_textMuted' },
  description: { margin: 0 },
  values: {
    display: 'grid',
    gridTemplateColumns: 'max-content 1fr',
    columnGap: '_md',
    rowGap: '_xs',
    margin: 0,
    marginBlockStart: '_sm',
    fontSize: '_sm',
  },
  valueTerm: { margin: 0 },
  valueText: { margin: 0, color: '_textMuted' },
});

/** 组件 API 的表格：名称、类型、默认值、说明与可选值 */
export const PropsTable = _component(({ props, caption, ...rest }: PropsTableProps) => {
  const messages = useMessages('docsKit', docsKitMessages);
  return () => (
    <Table {...mergePartProps<TableProps>({ density: 'compact' }, rest)}>
      {hasContent(caption) && <TableCaption>{caption}</TableCaption>}
      <TableHead>
        <TableRow>
          <TableHeaderCell sx={propsTableStyles.head}>{messages.name}</TableHeaderCell>
          <TableHeaderCell sx={propsTableStyles.head}>{messages.type}</TableHeaderCell>
          <TableHeaderCell sx={propsTableStyles.head}>{messages.defaultValue}</TableHeaderCell>
          <TableHeaderCell sx={propsTableStyles.head}>{messages.description}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.map((prop) => (
          <TableRow key={prop.name}>
            <TableCell>
              <span {...mergeAttrs<'span'>({ sx: propsTableStyles.name })}>
                <Code sx={propsTableStyles.nameCode}>{prop.name}</Code>
                {prop.required && <Badge tone="warning">{messages.required}</Badge>}
                {prop.bindable && <Badge tone="accent">{messages.bindable}</Badge>}
              </span>
            </TableCell>
            <TableCell>
              <Code sx={propsTableStyles.type}>{prop.type}</Code>
            </TableCell>
            <TableCell nowrap>
              {prop.default != null ? (
                <Code>{prop.default}</Code>
              ) : (
                <span {...mergeAttrs<'span'>({ sx: propsTableStyles.muted })}>—</span>
              )}
            </TableCell>
            <TableCell sx={propsTableStyles.descriptionCell}>
              <p {...mergeAttrs<'p'>({ sx: propsTableStyles.description })}>{prop.description}</p>
              {prop.values && prop.values.some((value) => value.description) && (
                <dl {...mergeAttrs<'dl'>({ sx: propsTableStyles.values })}>
                  {prop.values.map((value) => [
                    <dt
                      key={`${value.value}-term`}
                      {...mergeAttrs<'dt'>({ sx: propsTableStyles.valueTerm })}
                    >
                      <Code>{value.value}</Code>
                    </dt>,
                    <dd
                      key={`${value.value}-text`}
                      {...mergeAttrs<'dd'>({ sx: propsTableStyles.valueText })}
                    >
                      {value.description}
                    </dd>,
                  ])}
                </dl>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});
