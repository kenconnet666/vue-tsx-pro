// 静态表格：原生 table 结构、列标题的 scope、标题、对齐与外层滚动容器
import { describe, expect, it } from 'vitest';
import { hasStyles, mount } from '../../utils/.test/mount';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  tableStyles,
} from '../Table';

const headerFill = css.create({ fill: { backgroundColor: '_fill' } });

describe('Table', () => {
  it('渲染原生 table 结构，列标题默认 scope="col"，标题是 caption', () => {
    const root = mount(() => (
      <Table striped>
        <TableCaption>属性</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeaderCell>名称</TableHeaderCell>
            <TableHeaderCell align="end">默认值</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>size</TableCell>
            <TableCell align="end">md</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ));
    const table = root.querySelector('table')!;
    expect(table.parentElement!.tagName).toBe('DIV');
    expect(table.querySelector('caption')!.textContent).toBe('属性');
    expect([...table.querySelectorAll('th')].map((cell) => cell.getAttribute('scope'))).toEqual([
      'col',
      'col',
    ]);
    expect(table.querySelectorAll('tbody td')).toHaveLength(2);
  });

  it('表体、表尾里的行标题用单元格的样式（不是列标题的底色）；表尾的单元格统一加粗、上方分隔线', () => {
    const root = mount(() => (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>项目</TableHeaderCell>
            <TableHeaderCell>金额</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableHeaderCell scope="row">设计</TableHeaderCell>
            <TableCell>1200</TableCell>
          </TableRow>
        </TableBody>
        <TableFoot>
          <TableRow>
            <TableHeaderCell scope="row">合计</TableHeaderCell>
            <TableCell>1200</TableCell>
          </TableRow>
        </TableFoot>
      </Table>
    ));
    const columnHeader = root.querySelector<HTMLElement>('thead th')!;
    const rowHeader = root.querySelector<HTMLElement>('tbody th')!;
    const footHeader = root.querySelector<HTMLElement>('tfoot th')!;
    // 列标题有浅色底，行标题没有（按元素实际得到的声明判断）
    expect(hasStyles(columnHeader!, headerFill.fill)).toBe(true);
    expect(hasStyles(rowHeader!, headerFill.fill)).toBe(false);
    expect(hasStyles(rowHeader!, tableStyles.rowHeader)).toBe(true);
    expect(hasStyles(footHeader!, tableStyles.footCell)).toBe(true);
    expect(hasStyles(root.querySelector('tfoot td')!, tableStyles.footCell)).toBe(true);
  });
});
