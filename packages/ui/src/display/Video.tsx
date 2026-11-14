/**
 * 视频（video）：浏览器自己的控制条，加上固定的宽高比（加载前就占好位置）、封面、多种格式、字幕轨道。
 *
 *   <Video src={demo} poster={cover} aria-label="产品演示" />
 *   <Video
 *     sources={[{ src: clip.av1, type: 'video/mp4; codecs=av01.0.05M.08' }, { src: clip.h264, type: 'video/mp4' }]}
 *     tracks={[{ src: zh, srclang: 'zh', label: '中文', default: true }]}
 *     aria-label="安装步骤"
 *   />
 *   <Video src={loop} autoplay loop controls={false} aria-label="背景动画" />
 *
 * - 自动播放（autoplay）：默认静音（浏览器不允许带声音的自动播放）、行内播放；系统要求减少动态效果时不自动播放，
 *   并显示控制条，让人自己决定要不要播。
 * - 画面按 contain 放进框里（不裁切），四周是黑底；不要固定比例时把 ratio 写成 null，按视频自己的尺寸。
 * - 默认只预加载元数据（preload="metadata"）；其余原生属性（loop、muted、crossorigin……）照常落到 video 上。
 * - 自绘的控制条不在这里：要倍速、清晰度、弹幕这些，用专门的播放器。
 *
 * 部件：Root（AspectRatio 的 div）、Media（video）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { partAttrs } from '../config/styles';
import { AspectRatio, type AspectRatioProps } from '../layout/AspectRatio';
import { useReducedMotion } from '../utils/dom/media-query';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';

/** 一种格式的视频源：浏览器从上到下取第一个能播的 */
export interface VideoSource {
  /** 地址 */
  src: string;
  /** 格式：浏览器不认的跳过（'video/webm'、'video/mp4; codecs=…'） */
  type?: string;
  /** 媒体条件：窄屏换一个小的文件（'(max-width: 40rem)'） */
  media?: string;
}

/** 一条文本轨道：字幕、说明、章节 */
export interface VideoTrack {
  /** WebVTT 文件的地址 */
  src: string;
  /** 语言（BCP 47：'zh'、'en'） */
  srclang: string;
  /** 菜单里显示的名字 */
  label: string;
  /**
   * 种类：subtitles 是对白的翻译，captions 还包括音效说明（给听不到声音的人），descriptions 是画面的文字说明
   * @default 'subtitles'
   */
  kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
  /** 默认打开这一条 */
  default?: boolean;
}

/** 未声明的属性落到 video 上；外层用 propsRoot */
export interface VideoProps extends PartProps<'video', 'src' | 'poster' | 'controls'> {
  /** 视频地址；有几种格式时用 sources */
  src?: string;
  /** 几种格式的视频源（写了它就不用 src） */
  sources?: readonly VideoSource[];
  /** 封面：开始播放前显示 */
  poster?: string;
  /** 文本轨道：字幕、说明 */
  tracks?: readonly VideoTrack[];
  /**
   * 宽高比；null 时不定比例，按视频自己的尺寸
   * @default 16 / 9
   */
  ratio?: number | string | null;
  /**
   * 显示浏览器的控制条；自动播放的装饰视频可以关掉（减少动态效果时仍会显示）
   * @default true
   */
  controls?: boolean;
  /** 自动播放：默认静音、行内播放；减少动态效果时不自动播放 */
  autoplay?: boolean;
  /** 外层（AspectRatio）的部件属性 */
  propsRoot?: Partial<AspectRatioProps>;
}

/** 部件的标记（data-scope="video"） */
const videoPart = (part: string) => partAttrs({ name: 'Video' }, part);

/** Video 的样式：root、media、natural */
const videoStyles = css.create({
  root: { borderRadius: '_md', backgroundColor: 'black' },
  // 画面完整放进框里，不裁切（AspectRatio 默认给 video 的是 cover）
  media: { display: 'block', objectFit: 'contain' },
  // 不定比例：按视频自己的尺寸，宽度不超过容器
  natural: { display: 'block', maxWidth: '_full', height: 'auto', borderRadius: '_md' },
});

/** 视频：原生控制条、定比例、封面、多种格式、字幕 */
export const Video = _component(
  ({
    src,
    sources,
    poster,
    tracks,
    ratio = 16 / 9,
    controls = true,
    autoplay = false,
    propsRoot,
    ...rest
  }: VideoProps) => {
    const reducedMotion = useReducedMotion();

    return () => {
      // 减少动态效果：不自动播放，交给人自己点
      const plays = autoplay && !reducedMotion.value;
      const media = (
        <video
          {...mergeAttrs<'video'>(
            {
              sx: ratio == null ? videoStyles.natural : videoStyles.media,
              preload: 'metadata',
              // 自动播放要静音才被浏览器允许；手机上行内播放，不自动进全屏
              muted: autoplay || undefined,
              playsinline: true,
              ...videoPart('media'),
            },
            rest,
            {
              src: sources?.length ? undefined : src,
              poster,
              controls: controls || (autoplay && !plays),
              autoplay: plays,
            },
          )}
        >
          {sources?.map((source) => (
            <source key={`${source.media ?? ''}|${source.type ?? ''}|${source.src}`} {...source} />
          ))}
          {tracks?.map((track) => (
            <track
              key={`${track.kind ?? 'subtitles'}|${track.srclang}`}
              kind="subtitles"
              {...track}
            />
          ))}
        </video>
      );
      if (ratio == null) return media;
      return (
        <AspectRatio
          {...mergePartProps<AspectRatioProps>(
            { ratio, sx: videoStyles.root, ...videoPart('root') },
            propsRoot,
          )}
        >
          {media}
        </AspectRatio>
      );
    };
  },
);
