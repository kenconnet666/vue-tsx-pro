/**
 * 视频（video）：固定的宽高比（加载前就占好位置）、封面、多种格式、字幕轨道；控制条用浏览器自己的，或跟主题走的自绘控制条。
 *
 *   <Video src={demo} poster={cover} aria-label="产品演示" />
 *   <Video src={demo} controls="custom" aria-label="产品演示" />      // 自绘的控制条：倍速、字幕、全屏
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
 * - controls="custom"：播放 / 暂停、进度、时间、静音与音量、字幕（有 tracks 时）、倍速、全屏，样式跟主题；
 *   播放中鼠标离开画面、或几秒不动就收起；暂停、移动鼠标、键盘聚焦、菜单开着时留着。点画面切换播放。键盘见文档的键盘一节。
 *   各家浏览器的原生控制条长得不一样、也不跟主题：要统一外观时用它；只要能播，用默认的原生控制条更稳。
 *
 * 部件：Root（AspectRatio 的 div）、Media（video）、Controls（控制条）、Play、Time、Seek、Mute、Volume、Captions、Speed、Fullscreen。
 */
import { Captions, Gauge, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { partAttrs } from '../config/styles';
import { t } from '../config/theme/tokens';
import { Slider, type SliderProps } from '../input/Slider';
import { AspectRatio, type AspectRatioProps } from '../layout/AspectRatio';
import { Menu, MenuRadioGroup, MenuRadioItem } from '../overlay/Menu';
import { clamp } from '../utils/data/number';
import { useFullscreen } from '../utils/dom/fullscreen';
import { isEditable } from '../utils/dom/hotkeys';
import { useReducedMotion } from '../utils/dom/media-query';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { coarsePointer } from '../utils/style/styles';

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
   * 宽高比；null 时不定比例，按视频自己的尺寸（自绘的控制条需要外框，这时仍用原生的）
   * @default 16 / 9
   */
  ratio?: number | string | null;
  /**
   * 控制条：true 是浏览器自己的，'custom' 是自绘的（跟主题、带倍速与字幕），false 不要
   * @default true
   */
  controls?: boolean | 'custom';
  /** 自动播放：默认静音、行内播放；减少动态效果时不自动播放 */
  autoplay?: boolean;
  /**
   * 倍速菜单里的选项（controls="custom"）
   * @default [0.5, 0.75, 1, 1.25, 1.5, 2]
   */
  speeds?: readonly number[];
  /** 外层（AspectRatio）的部件属性 */
  propsRoot?: Partial<AspectRatioProps>;
  /** 自绘控制条的部件属性 */
  propsControls?: PartProps<'div'>;
  /** 控制条里各个按钮的部件属性 */
  propsButton?: Partial<IconButtonProps>;
  /** 进度滑块的部件属性（范围是视频的时长） */
  propsSeek?: Partial<Omit<SliderProps, 'min' | 'max' | 'disabled'>>;
  /** 音量滑块的部件属性（范围是 0–1） */
  propsVolume?: Partial<Omit<SliderProps, 'min' | 'max'>>;
}

/** 部件的标记（data-scope="video"） */
const videoPart = (part: string) => partAttrs({ name: 'Video' }, part);

/** 方向键一次快进、快退多少秒 */
const SEEK_STEP = 5;
/** 播放中多久不动就收起控制条（ms） */
const IDLE = 2500;
const DEFAULT_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Video 的样式：root、media、natural，以及自绘控制条的 controls、hidden、button、time、seek、volume、track、range */
const videoStyles = css.create({
  root: { borderRadius: '_md', backgroundColor: 'black' },
  // 画面完整放进框里，不裁切（AspectRatio 默认给 video 的是 cover）
  media: { display: 'block', objectFit: 'contain' },
  // 不定比例：按视频自己的尺寸，宽度不超过容器
  natural: { display: 'block', maxWidth: '_full', height: 'auto', borderRadius: '_md' },
  // 自绘控制条的外框：收起时连鼠标指针一起藏起来
  custom: { outlineStyle: 'none' },
  idle: { cursor: 'none' },
  // 控制条：贴在底边，下面压一层由透明到深色的渐变，白字在任何画面上都读得清
  controls: {
    position: 'absolute',
    insetInline: 0,
    top: 'auto',
    bottom: 0,
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '_xs',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    color: '_onScrim',
    backgroundImage: `linear-gradient(to top, ${t.colors.scrimStrong}, transparent)`,
    transition: `opacity ${t.durations.md} ${t.easings.standard}`,
  },
  // 收起：看不见、点不到。键盘聚焦到里面时仍然出现；鼠标点过按钮留下的焦点不算（否则点了播放就再也不收起）
  hidden: {
    opacity: { default: 0, ':has(:focus-visible)': 1 },
    pointerEvents: { default: 'none', ':has(:focus-visible)': 'auto' },
  },
  // 按钮：深色画面上的白色图标，悬停是一层浅白（同 Lightbox 的工具栏）
  button: {
    flexShrink: 0,
    color: '_onScrim',
    backgroundColor: {
      default: 'transparent',
      _hover: `color-mix(in srgb, ${t.colors.onScrim} 16%, transparent)`,
    },
  },
  time: {
    flexShrink: 0,
    fontSize: '_xs',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  seek: { flexGrow: 1, minWidth: '4em' },
  // 音量滑块只给鼠标：手机上用机身的音量键（iOS 也不让网页改音量）
  volume: { width: '4.5em', flexShrink: 0, display: { default: null, [coarsePointer]: 'none' } },
  // 滑块在深色画面上：轨道是半透明的白，走过的一段是白
  track: { backgroundColor: `color-mix(in srgb, ${t.colors.onScrim} 30%, transparent)` },
  range: { backgroundColor: '_onScrim' },
});

/** 秒 → 1:05、1:02:03 */
function clock(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const total = Math.max(0, Math.floor(seconds));
  const pad = (value: number) => String(value).padStart(2, '0');
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(total % 60)}`
    : `${minutes}:${pad(total % 60)}`;
}

/** 视频：定比例、封面、多种格式、字幕；原生或自绘的控制条 */
export const Video = _component(
  ({
    src,
    sources,
    poster,
    tracks,
    ratio = 16 / 9,
    controls = true,
    autoplay = false,
    speeds = DEFAULT_SPEEDS,
    propsRoot,
    propsControls,
    propsButton,
    propsSeek,
    propsVolume,
    ...rest
  }: VideoProps) => {
    const lang = useLang();
    const reducedMotion = useReducedMotion();
    let video = _state.raw<HTMLVideoElement | null>(null);
    let frame = _state.raw<HTMLElement | null>(null);
    const fullscreen = useFullscreen(() => frame);

    // 自绘控制条跟着 video 的事件走的状态
    let playing = _state(false);
    let current = _state(0);
    let duration = _state(0);
    let volume = _state(1);
    let muted = _state(false);
    let speed = _state(1);
    // 显示着的字幕轨道（按下标）；'' 是不显示
    let caption = _state('');
    // 控制条露着没有：播放中鼠标一会儿不动就收起
    let shown = _state(true);
    let bar = _state.raw<HTMLElement | null>(null);
    // 哪个菜单开着：开着时控制条不收起
    const menus = { captions: false, speed: false };
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    onBeforeUnmount(() => clearTimeout(idleTimer));

    /** 正在用控制条：菜单开着，或鼠标停在控制条上 */
    const busy = () => menus.captions || menus.speed || bar?.matches(':hover') === true;

    /** 露出控制条；播放中过一会儿自动收起（正在用控制条时再等一轮） */
    function wake() {
      shown = true;
      clearTimeout(idleTimer);
      if (playing) idleTimer = setTimeout(() => (busy() ? wake() : (shown = false)), IDLE);
    }
    /** 鼠标离开画面：不用等，直接收起 */
    function leave() {
      if (playing && !busy()) shown = false;
    }
    /** 菜单开、关：开着的时候控制条留着，关了重新计时 */
    function onMenuToggle(menu: keyof typeof menus, open: boolean) {
      menus[menu] = open;
      wake();
    }

    function sync() {
      const element = video;
      if (!element) return;
      playing = !element.paused && !element.ended;
      current = element.currentTime;
      duration = Number.isFinite(element.duration) ? element.duration : 0;
      volume = element.volume;
      muted = element.muted;
      speed = element.playbackRate;
      const showing = [...element.textTracks].findIndex((track) => track.mode === 'showing');
      caption = showing < 0 ? '' : String(showing);
    }

    const toggle = () => (video?.paused ? void video.play().catch(() => {}) : video?.pause());
    const seekTo = (seconds: number) => {
      if (!video) return;
      video.currentTime = clamp(seconds, 0, duration || 0);
      current = video.currentTime;
    };
    const setVolume = (value: number) => {
      if (!video) return;
      video.volume = clamp(value, 0, 1);
      // 拖到有声音就取消静音，拖到 0 就是静音
      video.muted = video.volume === 0;
    };
    const setCaption = (index: string) => {
      if (!video) return;
      [...video.textTracks].forEach(
        (track, position) => (track.mode = String(position) === index ? 'showing' : 'disabled'),
      );
      caption = index;
    };

    /** 焦点在播放器里时的键盘：空格 / K 播放暂停，← → 快退快进，↑ ↓ 音量，M 静音，F 全屏 */
    function onKeydown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || isEditable(event.target)) return;
      // 焦点在滑块、菜单上时，方向键、空格是它们的
      const inControl = (event.target as Element).closest('[role="slider"], [role="menu"]');
      const onButton = (event.target as Element).closest('button');
      const key = event.key.toLowerCase();
      const actions: Record<string, (() => void) | undefined> = {
        k: toggle,
        ' ': onButton ? undefined : toggle,
        m: () => video && (video.muted = !video.muted),
        f: () => void fullscreen.toggle(),
        arrowleft: inControl ? undefined : () => seekTo(current - SEEK_STEP),
        arrowright: inControl ? undefined : () => seekTo(current + SEEK_STEP),
        arrowup: inControl ? undefined : () => setVolume(volume + 0.1),
        arrowdown: inControl ? undefined : () => setVolume(volume - 0.1),
      };
      const action = actions[key];
      if (!action) return;
      event.preventDefault();
      action();
      wake();
    }

    function renderControls() {
      const button = (
        props: Partial<IconButtonProps> & Pick<IconButtonProps, 'icon'>,
        part: string,
      ) =>
        mergePartProps<IconButtonProps>(
          {
            size: 'sm',
            variant: 'ghost',
            tone: 'neutral',
            sx: videoStyles.button,
            ...videoPart(part),
            ...props,
          } as IconButtonProps,
          propsButton,
        );
      const slider = {
        propsTrack: { sx: videoStyles.track },
        propsRange: { sx: videoStyles.range },
      };
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [videoStyles.controls, !shown && videoStyles.hidden],
              ...videoPart('controls'),
            },
            propsControls,
            // 点控制条不算点画面（不切换播放）
            { ref: _toRef(bar), onClick: (event: MouseEvent) => event.stopPropagation() },
          )}
          data-state={shown ? 'visible' : 'hidden'}
        >
          <IconButton
            {...button(
              {
                icon: playing ? Pause : Play,
                'aria-label': playing ? lang.videoPause : lang.videoPlay,
                onClick: toggle,
              },
              'play',
            )}
          />
          <span {...css.attrs(videoStyles.time)} {...videoPart('time')}>
            {clock(current)} / {clock(duration)}
          </span>
          <Slider
            {...mergePartProps<SliderProps>(
              {
                ...slider,
                size: 'xs',
                step: 1,
                bigStep: 10,
                'aria-label': lang.videoSeek,
                valueText: (value: number) => lang.videoTime(clock(value), clock(duration)),
                propsRoot: { sx: videoStyles.seek, ...videoPart('seek') },
              },
              propsSeek,
              { min: 0, max: duration || 1, disabled: duration === 0 },
            )}
            _value={current}
            onUpdate:_value={(value: number) => seekTo(value)}
          />
          <IconButton
            {...button(
              {
                icon: muted || volume === 0 ? VolumeX : Volume2,
                'aria-label': muted ? lang.videoUnmute : lang.videoMute,
                'aria-pressed': muted,
                onClick: () => video && (video.muted = !video.muted),
              },
              'mute',
            )}
          />
          <Slider
            {...mergePartProps<SliderProps>(
              {
                ...slider,
                size: 'xs',
                step: 0.05,
                bigStep: 0.2,
                'aria-label': lang.videoVolume,
                valueText: (value: number) => `${Math.round(value * 100)}%`,
                propsRoot: { sx: videoStyles.volume, ...videoPart('volume') },
              },
              propsVolume,
              { min: 0, max: 1 },
            )}
            _value={muted ? 0 : volume}
            onUpdate:_value={(value: number) => setVolume(value)}
          />
          {tracks && tracks.length > 0 && (
            <Menu
              placement="top-end"
              onOpenChange={(open) => onMenuToggle('captions', open)}
              trigger={(props) => (
                <IconButton
                  {...button({ icon: Captions, 'aria-label': lang.videoCaptions }, 'captions')}
                  {...props}
                />
              )}
            >
              <MenuRadioGroup
                label={lang.videoCaptions}
                _value={caption}
                onUpdate:_value={(index: string) => setCaption(index)}
              >
                <MenuRadioItem value="">{lang.videoCaptionsOff}</MenuRadioItem>
                {tracks.map((track, index) => (
                  <MenuRadioItem key={index} value={String(index)}>
                    {track.label}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </Menu>
          )}
          <Menu
            placement="top-end"
            onOpenChange={(open) => onMenuToggle('speed', open)}
            trigger={(props) => (
              <IconButton
                {...button({ icon: Gauge, 'aria-label': lang.videoSpeed }, 'speed')}
                {...props}
              />
            )}
          >
            <MenuRadioGroup
              label={lang.videoSpeed}
              _value={String(speed)}
              onUpdate:_value={(value: string) => video && (video.playbackRate = Number(value))}
            >
              {speeds.map((value) => (
                <MenuRadioItem key={value} value={String(value)}>
                  {value}×
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </Menu>
          {fullscreen.supported && (
            <IconButton
              {...button(
                {
                  icon: fullscreen.active ? Minimize : Maximize,
                  'aria-label': fullscreen.active ? lang.videoExitFullscreen : lang.videoFullscreen,
                  onClick: () => void fullscreen.toggle(),
                },
                'fullscreen',
              )}
            />
          )}
        </div>
      );
    }

    return () => {
      // 减少动态效果：不自动播放，交给人自己点
      const plays = autoplay && !reducedMotion.value;
      // 自绘的控制条要画在外框里：不定比例（没有外框）时用原生的
      const custom = controls === 'custom' && ratio != null;
      const native = custom ? false : controls !== false || (autoplay && !plays);
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
              ref: _toRef(video),
              src: sources?.length ? undefined : src,
              poster,
              controls: native,
              autoplay: plays,
              ...(custom && {
                onPlay: () => {
                  sync();
                  wake();
                },
                onPause: () => {
                  sync();
                  wake();
                },
                onEnded: sync,
                onTimeupdate: () => (current = video?.currentTime ?? 0),
                onDurationchange: sync,
                onLoadedmetadata: sync,
                onVolumechange: sync,
                onRatechange: sync,
              }),
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
            {
              ratio,
              sx: [
                videoStyles.root,
                custom && videoStyles.custom,
                custom && playing && !shown && videoStyles.idle,
              ],
              ...videoPart('root'),
            },
            propsRoot,
            custom
              ? {
                  ref: _toRef(frame),
                  // 点画面后焦点落在播放器上（键盘才有地方接），但不多占一个 Tab 停靠点
                  tabindex: -1,
                  onKeydown,
                  onPointermove: wake,
                  onPointerleave: leave,
                  onFocusin: wake,
                  // 点画面：播放 / 暂停
                  onClick: toggle,
                }
              : {},
          )}
          data-state={custom ? (playing ? 'playing' : 'paused') : undefined}
        >
          {media}
          {custom && renderControls()}
        </AspectRatio>
      );
    };
  },
);
