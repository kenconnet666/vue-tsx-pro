import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Button, Tooltip, type FloatingPlacement } from '@vue-tsx-pro/ui';

// 三行三列围着中间：每条边三个对齐方式
const rows: (FloatingPlacement | null)[][] = [
  [null, 'top-start', 'top', 'top-end', null],
  ['left-start', null, null, null, 'right-start'],
  ['left', null, null, null, 'right'],
  ['left-end', null, null, null, 'right-end'],
  [null, 'bottom-start', 'bottom', 'bottom-end', null],
];

const styles = stylex.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, max-content)',
    gap: '_sm',
    justifyContent: 'center',
  },
});

export default _component(() => () => (
  <div {...stylex.attrs(styles.grid)}>
    {rows.flat().map((placement, index) =>
      placement ? (
        <Tooltip
          key={placement}
          placement={placement}
          arrow
          trigger={(props) => (
            <Button {...props} size="sm" variant="outline" tone="neutral">
              {placement}
            </Button>
          )}
        >
          placement="{placement}"
        </Tooltip>
      ) : (
        <span key={index} />
      ),
    )}
  </div>
));
