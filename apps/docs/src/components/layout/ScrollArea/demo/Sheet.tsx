import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, ScrollArea, VisuallyHidden } from '@vue-tsx-pro/ui';

const columns = Array.from({ length: 14 }, (_, index) => String.fromCharCode(65 + index));
const rows = Array.from({ length: 30 }, (_, index) => index + 1);

const styles = css.create({
  area: { height: '18rem' },
  table: { borderCollapse: 'collapse', fontSize: '_sm', fontVariantNumeric: 'tabular-nums' },
  cell: {
    minWidth: '5.5rem',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    textAlign: 'end',
    whiteSpace: 'nowrap',
  },
  // 表头与行号固定：滚动时一直看得到
  head: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: '_fill',
    color: '_textMuted',
    textAlign: 'center',
    fontWeight: '_medium',
  },
  rowHead: { position: 'sticky', insetInlineStart: 0, minWidth: '3rem' },
  corner: { zIndex: 2 },
});

const value = (row: number, column: number) => ((row * 7919 + column * 104_729) % 100_000) / 100;

export default _component(() => () => (
  <Card padding="none">
    <ScrollArea axis="both" sx={styles.area} propsViewport={{ 'aria-label': '销售明细表' }}>
      <table {...css.attrs(styles.table)}>
        <thead>
          <tr>
            <th {...css.attrs(styles.cell, styles.head, styles.rowHead, styles.corner)}>
              <VisuallyHidden>行号</VisuallyHidden>
            </th>
            {columns.map((column) => (
              <th key={column} scope="col" {...css.attrs(styles.cell, styles.head)}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th scope="row" {...css.attrs(styles.cell, styles.head, styles.rowHead)}>
                {row}
              </th>
              {columns.map((column, index) => (
                <td key={column} {...css.attrs(styles.cell)}>
                  {value(row, index).toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  </Card>
));
