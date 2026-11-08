/**
 * 一个示例：小节标题（带锚点，进本页目录）、说明文字、示例卡片（效果 + 源码，可以带进演练场编辑）。
 *
 *   import Variants from './demo/Variants.tsx?demo';
 *   <Example id="variants" title="样式" demo={Variants}>六种样式对应不同的强调程度…</Example>
 *
 * 按视口排版、占整页的示例（AppShell）放在 frames 目录，写 frame 给出高度，效果区用 iframe 单独打开它：
 *
 *   import Admin from './frames/Admin.tsx?demo';
 *   <Example id="admin" title="后台" demo={Admin} frame="36rem" />
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { SlidersHorizontal } from '@lucide/icons';
import {
  createFlex,
  darkTheme,
  dataAttrs,
  H2,
  IconButton,
  lightTheme,
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  Paragraph,
  Provider,
  type Theme,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { CodePreview, type CodePreviewAligns } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';
import { h, onBeforeUnmount, onMounted, watch, type VNodeChild } from 'vue';
import { framePath } from '../router';
import { canvasStyles } from './canvas';
import { EditInPlayground } from './EditInPlayground';
import { afterFirstPaint } from './idle';
import { scaledTheme, siteTheme } from './theme';
import type { Demo } from './types';

const styles = css.create({
  canvas: { minHeight: '7rem' },
  // iframe 贴满效果区，不留内边距
  framed: { padding: 0 },
  frame: { display: 'block', width: '100%', borderStyle: 'none' },
  description: { color: '_textMuted' },
  // 示例工具：包住示例的一层不占位；窄屏时是一块 375px 宽、虚线框住的区域
  tools: { display: 'contents' },
  narrow: {
    display: 'block',
    width: 'min(375px, 100%)',
    alignSelf: 'center',
    outlineWidth: '1px',
    outlineStyle: 'dashed',
    outlineColor: '_border',
    outlineOffset: '0.5em',
  },
  // 反色主题：Provider 只换 token，底色要自己铺
  inverted: { padding: '_md', borderRadius: '_md', backgroundColor: '_surface', color: '_text' },
  // 还没渲染的示例卡片：大致一张卡片的高度，补上时下面的内容少跳一点
  placeholder: {
    minHeight: '16rem',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_lg',
  },
});

/** ExampleColumn 交给示例的：自己在这一列里排第几 */
export const ExampleColumnContext = createContext<{ next(): number }>('ExampleColumn');

/** 每列前几个示例立即渲染（宽屏的首屏大致放得下），其余在首帧之后补上 */
const IMMEDIATE = 2;

const frameHeight = css.create({ height: (height: string) => ({ height }) });

/** 每个示例是一个小节（section） */
const Section = createFlex('section', 'ExampleSection');

/** Example 的属性 */
export interface ExampleProps {
  /** 小节的锚点（英文，本页唯一） */
  id: string;
  /** 小节标题 */
  title: string;
  /** `?demo` 导入的示例 */
  demo: Demo;
  /** 效果区的排列，默认 start */
  align?: keyof CodePreviewAligns;
  /** 整页示例：效果区的高度（CSS 长度），示例在 iframe 里单独打开（只限 frames 目录里的示例） */
  frame?: string;
  /** 说明文字 */
  children?: VNodeChild;
}

/**
 * 示例小节：标题、说明、示例卡片。标题与说明总是立即渲染（本页目录、锚点照常）；
 * 列里靠后的示例卡片先占位，滚到附近或首帧之后空闲时再渲染（换页时先把首屏画出来）
 */
export const Example = _component(({ id, title, demo, align, frame, children }: ExampleProps) => {
  const order = ExampleColumnContext.inject({ next: () => 0 }).next();
  // 带锚点打开（#某一节）时全部立即渲染：靠后的示例补上时会把锚点往下推
  let ready = _state(
    order < IMMEDIATE || (typeof location !== 'undefined' && location.hash !== ''),
  );
  let placeholder = _state.raw<HTMLElement | null>(null);
  let stop = () => {};
  onMounted(() => {
    if (ready || !placeholder) return;
    const show = () => {
      ready = true;
      stop();
    };
    const near = new IntersectionObserver(([entry]) => entry?.isIntersecting && show(), {
      rootMargin: '100% 0px',
    });
    near.observe(placeholder);
    const cancel = afterFirstPaint(show);
    stop = () => {
      near.disconnect();
      cancel();
    };
  });
  onBeforeUnmount(() => stop());

  // 示例工具的开关：只影响这一个示例
  let narrow = _state(false);
  let rtl = _state(false);
  let invert = _state(false);
  // 缩放：主题编辑器的 scaling，0.9 是紧凑、1.1 是宽松（字号缩放，间距、控件高度以 em 计跟着变）
  let scale = _state('1');
  // 示例换上的主题：反色时按打开那一刻页面的配色方案取相反的，再套缩放；都没开时不换
  let toolTheme = _state.raw<Theme | null>(null);
  watch(
    () => [invert, scale, invert || scale !== '1' ? siteTheme() : null] as const,
    async ([opposite, scaling, site], _, onCleanup) => {
      let stale = false;
      onCleanup(() => (stale = true));
      const base = opposite ? oppositeTheme() : site;
      const theme = base && scaling !== '1' ? await scaledTheme(base, Number(scaling)) : base;
      if (!stale) toolTheme = theme;
    },
  );

  return () => (
    <Section direction="column" gap="md">
      <H2 id={id} size="xl" anchor>
        {title}
      </H2>
      {children != null && <Paragraph sx={styles.description}>{children}</Paragraph>}
      {ready ? renderCard() : <div ref={_toRef(placeholder)} {...css.attrs(styles.placeholder)} />}
    </Section>
  );

  function renderCard() {
    return (
      <CodePreview
        code={demo.source}
        align={align}
        actions={
          <>
            {frame == null && renderTools()}
            <EditInPlayground code={demo.source} />
          </>
        }
        propsLayout={frame != null ? { sx: styles.framed } : undefined}
        propsPreview={{
          sx: [canvasStyles.canvas, styles.canvas],
          // 示例里的标题不进本页目录（App 收集目录时跳过 data-demo 里的标题）
          ...dataAttrs({ 'data-demo': '' }),
        }}
      >
        {frame != null ? (
          <iframe
            src={framePath(demo.path)}
            title={title}
            loading="lazy"
            allow="fullscreen"
            {...css.attrs(styles.frame, frameHeight.height(frame))}
          />
        ) : (
          renderDemo()
        )}
      </CodePreview>
    );
  }

  /** 示例工具：窄屏、从右到左、反色主题、缩放（紧凑、宽松），看示例在这些条件下是否还对 */
  function renderTools() {
    const active = narrow || rtl || invert || scale !== '1';
    return (
      <Menu
        trigger={(props) => (
          <IconButton
            {...props}
            icon={SlidersHorizontal}
            aria-label="示例工具"
            size="sm"
            variant={active ? 'soft' : 'ghost'}
            tone={active ? 'accent' : 'neutral'}
          />
        )}
      >
        <MenuGroup label="示例工具">
          <MenuCheckboxItem _checked={narrow}>窄屏（375 px）</MenuCheckboxItem>
          <MenuCheckboxItem _checked={rtl}>从右到左</MenuCheckboxItem>
          <MenuCheckboxItem _checked={invert}>反色主题</MenuCheckboxItem>
        </MenuGroup>
        <MenuRadioGroup label="缩放" _value={scale}>
          <MenuRadioItem value="0.9">紧凑（90%）</MenuRadioItem>
          <MenuRadioItem value="1">默认</MenuRadioItem>
          <MenuRadioItem value="1.1">宽松（110%）</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>
    );
  }

  /** 示例本身；开了示例工具时包一层（没开时原样，示例的排版不受影响） */
  function renderDemo() {
    const content = h(demo.component);
    if (!narrow && !rtl && !toolTheme) return content;
    return (
      <div dir={rtl ? 'rtl' : undefined} {...css.attrs(styles.tools, narrow && styles.narrow)}>
        {toolTheme ? (
          <Provider theme={toolTheme}>
            {invert ? <div {...css.attrs(styles.inverted)}>{content}</div> : content}
          </Provider>
        ) : (
          content
        )}
      </div>
    );
  }
});

/** 和页面现在相反的主题：页面是深色时给浅色，否则给深色 */
function oppositeTheme(): Theme {
  return getComputedStyle(document.documentElement).colorScheme === 'dark' ? lightTheme : darkTheme;
}
