// 可以拖宽的明细面板：手柄放在面板里、贴着它的结束边；拖动、聚焦后按 ← / →、双击回到初始宽度。数据是虚构的
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Descriptions,
  NavItem,
  NavList,
  ResizeHandle,
  Small,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';

const parts = [
  { no: 'SKU-0213', name: '显示器支架', material: '铝合金', quantity: 2 },
  { no: 'SKU-0475', name: '线缆收纳夹', material: 'ABS', quantity: 8 },
  { no: 'SKU-0630', name: '包装纸箱', material: '瓦楞纸', quantity: 4 },
  { no: 'SKU-0847', name: '桌面挡板', material: '亚克力', quantity: 6 },
];

const styles = css.create({
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
      <div {...css.attrs(styles.root)}>
        <div {...css.attrs(styles.panel, styles.width(width))}>
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
        <div {...css.attrs(styles.detail)}>
          <Text weight="semibold">{part.name}</Text>
          <Descriptions
            columns={2}
            size="sm"
            items={[
              { label: '件号', value: part.no },
              { label: '材料牌号', value: part.material },
              { label: '数量', value: part.quantity },
              { label: '列表宽度', value: `${width} px` },
            ]}
          />
          <Small tone="muted">拖动列表的右边、聚焦后按 ← / →，或双击回到 220 px</Small>
        </div>
      </div>
    );
  };
});
