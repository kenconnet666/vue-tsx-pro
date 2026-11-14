/**
 * 嵌入的页面（iframe）：地图、视频网站的播放器、在线文档、报表。固定的宽高比（加载前就占好位置）、滚到附近才加载、
 * 加载完之前是骨架；title 必填（读屏靠它知道这一块是什么）。
 *
 *   <Embed src="https://player.example.com/embed/42" title="产品演示视频" allow="fullscreen; picture-in-picture" />
 *   <Embed src={reportUrl} title="月度报表" ratio={4 / 3} sandbox="allow-scripts allow-same-origin" />
 *
 * - 没写 sandbox 时不加限制（同原生）；嵌入不受信任的页面时自己写 sandbox，只放开需要的权限。
 * - referrerpolicy 默认 strict-origin-when-cross-origin，loading 默认 lazy，都可以改。
 * - 外层的边框、圆角跟随主题；不要比例、要固定高度时把 ratio 写成 null，自己在 sx 里给高度。
 *
 * 部件：Root（AspectRatio 的 div）、Frame（iframe）、Placeholder（加载中的骨架）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch } from 'vue';
import { useMounted } from '../utils/dom/mounted';
import { partAttrs } from '../config/styles';
import { Skeleton, type SkeletonShapeProps } from '../feedback/Skeleton';
import { AspectRatio, type AspectRatioProps } from '../layout/AspectRatio';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';

/** 未声明的属性落到 iframe 上 */
export interface EmbedProps extends PartProps<'iframe', 'title' | 'src'> {
  /** 嵌入页面的地址 */
  src: string;
  /** 这一块是什么：读屏念它（iframe 没有名称时只会念“框架”） */
  title: string;
  /**
   * 宽高比；null 时不定比例，高度由 propsRoot 的 sx 给
   * @default 16 / 9
   */
  ratio?: number | string | null;
  /** 页面加载完了 */
  onLoad?: (event: Event) => void;
  /** 外层（AspectRatio）的部件属性 */
  propsRoot?: Partial<AspectRatioProps>;
  /** 加载中占位的骨架的部件属性 */
  propsPlaceholder?: SkeletonShapeProps;
}

/** 部件的标记（data-scope="embed"） */
const embedPart = (part: string) => partAttrs({ name: 'Embed' }, part);

/** Embed 的样式：root、frame、loading、placeholder */
const embedStyles = css.create({
  root: {
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_surface',
  },
  frame: { display: 'block', borderWidth: 0 },
  // 加载完之前先不显示：不少页面加载中是一片白，暗色主题里很刺眼
  loading: { opacity: 0 },
  // 骨架叠在 iframe 下面（外层只有一格，iframe 占着它）
  placeholder: { position: 'absolute', inset: 0, borderRadius: 0 },
});

/** 嵌入的页面：定比例、延迟加载、加载中显示骨架 */
export const Embed = _component(
  ({ src, title, ratio = 16 / 9, onLoad, propsRoot, propsPlaceholder, ...rest }: EmbedProps) => {
    let loaded = _state(false);
    // iframe 挂载后才渲染：服务端渲染出来的 iframe 在脚本接管之前就可能加载完了，load 事件听不到，骨架会一直留着
    const mounted = useMounted();
    // 换了地址：重新显示骨架
    watch(
      () => src,
      () => (loaded = false),
    );
    return () => (
      <AspectRatio
        {...mergePartProps<AspectRatioProps>(
          {
            ratio: ratio ?? 'auto',
            sx: embedStyles.root,
            ...embedPart('root'),
          },
          propsRoot,
        )}
        data-state={loaded ? 'loaded' : 'loading'}
      >
        {!loaded && (
          <Skeleton
            {...mergePartProps<SkeletonShapeProps>(
              { sx: embedStyles.placeholder, ...embedPart('placeholder') },
              propsPlaceholder,
            )}
          />
        )}
        {mounted.value && (
          <iframe
            {...mergeAttrs<'iframe'>(
              {
                sx: [embedStyles.frame, !loaded && embedStyles.loading],
                loading: 'lazy',
                referrerpolicy: 'strict-origin-when-cross-origin',
                ...embedPart('frame'),
              },
              rest,
              {
                src,
                title,
                onLoad: (event: Event) => {
                  loaded = true;
                  onLoad?.(event);
                },
              },
            )}
          />
        )}
      </AspectRatio>
    );
  },
);
