/**
 * 固定宽高比的框（div）：宽度跟着容器，高度按比例算，里面的内容铺满它。图片、视频、地图、嵌入的页面加载前就占好位置，
 * 加载完不把下面的内容顶开。
 *
 *   <AspectRatio ratio={16 / 9}>
 *     <img src={cover} alt="" />
 *   </AspectRatio>
 *   <AspectRatio ratio="4 / 3" sx={styles.map}>…</AspectRatio>
 *
 * 内容是一个元素：它被拉成和框一样大（img、video 这类按 object-fit: cover 裁切，要完整显示时在它上面写 contain）。
 * Embed 用它给 iframe 定比例；Image 自己有 width / height，不需要它。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { partAttrs } from '../config/styles';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到外层 div 上 */
export interface AspectRatioProps extends PartProps<'div'> {
  /**
   * 宽高比：数（16 / 9）或 CSS 的写法（'4 / 3'）
   * @default 16 / 9
   */
  ratio?: number | string;
  /** 铺满的内容（一个元素） */
  children?: VNodeChild;
}

/** 部件的标记（data-scope="aspect-ratio"） */
const aspectRatioPart = (part: string) => partAttrs({ name: 'AspectRatio' }, part);

/** AspectRatio 的样式：root */
const aspectRatioStyles = css.create({
  // 网格只有一格：里面的元素拉满这一格；min 是 0，内容再大也不把框撑开
  root: {
    position: 'relative',
    display: 'grid',
    gridTemplate: 'minmax(0, 1fr) / minmax(0, 1fr)',
    width: '_full',
    overflow: 'hidden',
  },
});

/** AspectRatio 的动态样式：比例 */
const aspectRatioDynamicStyles = css.create({
  ratio: (value: string) => ({ aspectRatio: value }),
});

let registered = false;

/** 里面的元素铺满（第一次用到时登记，同 partAttrs 的基础规则；最前面的级联层，使用方的样式盖得过） */
function registerFill() {
  if (registered) return;
  registered = true;
  // 替换元素（img、video、iframe）有自己的固有尺寸，不会被网格拉伸，要写明宽高
  css.globalRule('aspect-ratio-fill', ':where([data-scope="aspect-ratio"][data-part="root"]) > *', {
    width: '_full',
    height: '_full',
  });
  css.globalRule(
    'aspect-ratio-cover',
    ':where([data-scope="aspect-ratio"][data-part="root"]) > :where(img, video)',
    { objectFit: 'cover' },
  );
}

/** 固定宽高比的框 */
export const AspectRatio = _component(({ ratio = 16 / 9, children, ...rest }: AspectRatioProps) => {
  registerFill();
  return () => (
    <div
      {...mergeAttrs<'div'>(
        {
          sx: [aspectRatioStyles.root, aspectRatioDynamicStyles.ratio(String(ratio))],
          ...aspectRatioPart('root'),
        },
        rest,
      )}
    >
      {children}
    </div>
  );
});
