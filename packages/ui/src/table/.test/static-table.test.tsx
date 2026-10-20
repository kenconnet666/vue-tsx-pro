// 静态表格：原生 table 结构、列标题的 scope、标题、对齐与外层滚动容器
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../Table';

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
});
