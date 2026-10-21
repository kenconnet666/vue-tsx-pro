// 可以拖宽的明细面板：手柄放在面板里、贴着它的结束边；拖动、聚焦后按 ← / →、双击回到初始宽度。数据是虚构的
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Descriptions, NavItem, NavList, ResizeHandle, Small, Text } from '@vue-tsx-pro/ui';

const parts = [
  { no: 'C1H02-5513-101', name: '平尾翼根整流罩', material: '7050-T7451', quantity: 2 },
  { no: 'C1H04-5575-101', name: '液压管路卡箍', material: '2024-T351', quantity: 8 },
  { no: 'C1H06-5530-102', name: '舱门密封件', material: 'T700/环氧', quantity: 4 },
  { no: 'C1H08-5547-101', name: '襟翼滑轨罩', material: 'T300/环氧', quantity: 6 },
];

const styles = stylex.create({
  root: {
    display: 'flex',
    height: '12rem',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    overflow: 'hidden',
  },
  // 手柄是 position: absolute，量的是这个面板的宽度
  panel: {
    position: 'relative',
    flexShrink: 0,
    boxSizing: 'border-box',
    paddingBlock: '_sm',
    paddingInline: '_sm',
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_border',
    overflow: 'hidden',
  },
  width: (px: number) => ({ width: px }),
  detail: {
    flexGrow: 1,
    minWidth: 0,
    padding: '_md',
    display: 'flex',
    flexDirection: 'column',
    gap: '_md',
  },
});

export default _component(() => {
  let width = _state(220);
  let current = _state(parts[0]!.no);

  return () => {
    const part = parts.find((item) => item.no === current)!;
    return (
      <div {...stylex.attrs(styles.root)}>
        <div {...stylex.attrs(styles.panel, styles.width(width))}>
          <NavList aria-label="零件">
            {parts.map((item) => (
              <NavItem
                key={item.no}
                href={`#${item.no}`}
                active={item.no === current}
                onClick={(event: MouseEvent) => {
                  event.preventDefault();
                  current = item.no;
                }}
              >
                {item.name}
              </NavItem>
            ))}
          </NavList>
          <ResizeHandle
            aria-label="调整零件列表宽度"
            width={width}
            minWidth={160}
            maxWidth={360}
            defaultWidth={220}
            onWidthChange={(px) => (width = px)}
          />
        </div>
        <div {...stylex.attrs(styles.detail)}>
          <Text weight="semibold">{part.name}</Text>
          <Descriptions
            columns={2}
            size="sm"
            items={[
              { label: '件号', value: part.no },
              { label: '材料牌号', value: part.material },
              { label: '单机数量', value: part.quantity },
              { label: '列表宽度', value: `${width} px` },
            ]}
          />
          <Small tone="muted">拖动列表的右边、聚焦后按 ← / →，或双击回到 220 px</Small>
        </div>
      </div>
    );
  };
});
