/**
 * 文字表格：说明文档里的对照表，表头和单元格都是文字，反引号里的是行内代码（CodeText）。
 * 按列定义、要排序或合并单元格的表格用 ColumnTable、DataTable。
 *
 *   <TextTable head={['方法', '含义']} rows={[['`has(值)`', '含有这个值']]} />
 *
 * 第一列通常是名字，默认不折行。外观属性同 Table。
 * 部件：Table（外层）；每格是 TableCell。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { CodeText } from '../base/CodeText';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableProps,
} from '../table/Table';

/** 未声明的属性落到 Table 上 */
export interface TextTableProps extends TableProps {
  /** 表头 */
  head: readonly string[];
  /** 各行：每格一段文字 */
  rows: readonly (readonly string[])[];
  /**
   * 第一列不折行
   * @default true
   */
  nowrapFirst?: boolean;
}

/** TextTable 的样式：nowrap */
export const textTableStyles = css.create({
  nowrap: { whiteSpace: 'nowrap' },
});

/** 文字表格 */
export const TextTable = _component(
  ({ head, rows, nowrapFirst = true, ...rest }: TextTableProps) =>
    () => (
      <Table {...rest}>
        <TableHead>
          <TableRow>
            {head.map((cell) => (
              <TableHeaderCell key={cell}>{cell}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.join('|')}>
              {row.map((cell, index) => (
                <TableCell
                  key={index}
                  sx={index === 0 && nowrapFirst ? textTableStyles.nowrap : undefined}
                >
                  <CodeText text={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
);
