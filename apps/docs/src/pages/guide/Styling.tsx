/** 指南：写样式。css.create / attrs / sx、主题 token、状态与条件、随状态变的样式，以及定制组件 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Alert, Code, CodeBlock, Flex, H2, Paragraph } from '@vue-tsx-pro/ui';
import ComponentStyles from '../demo/ComponentStyles.tsx?demo';
import StyleBasics from '../demo/StyleBasics.tsx?demo';
import StyleDynamic from '../demo/StyleDynamic.tsx?demo';
import StyleStates from '../demo/StyleStates.tsx?demo';
import { DocPage } from '../../site/DocPage';
import { Example } from '../../site/Example';

const meta = {
  title: 'Styling 写样式',
  description:
    '写法像 StyleX 的运行时样式：css.create、attrs 与 sx，主题 token 的字符串写法，状态跟着 DOM 走的条件别名，状态变化不重新渲染组件的动态样式，以及用 createUi / Provider 的 styles 定制组件。',
};

const basics = `import * as css from '@vue-tsx-pro/tsx/styles';

const styles = css.create({
  card: {
    padding: '_lg',                                   // 主题 token：整个值是 token 时直接写字符串
    borderRadius: '_lg',
    borderColor: { default: '_borderMuted', ':hover': '_border' },   // 按条件取值
    transition: \`border-color \${t.durations.md} \${t.easings.standard}\`, // 值里夹着 token：模板字符串里的 t
  },
  featured: { borderColor: '_accentBorder' },
});

<section {...css.attrs(styles.card, featured && styles.featured)} />   // 原生元素：attrs 合成一个类
<Card sx={[styles.card, { marginTop: '_md' }]} />                       // 组件：sx，一次性的覆盖直接写对象`;

const customize = `createUi({
  styles: {
    Button: {
      base: { root: { letterSpacing: '0.02em' } },                  // 追加在组件自己的样式之后
      variants: { size: { xl: { root: { fontSize: '_xxl' } } } },  // 新档位：先扩展 ButtonVariants 接口
    },
  },
});

/* 宿主自己的 CSS 按部件选中，不依赖生成的类名 */
[data-scope='alert'][data-part='title'] { letter-spacing: 0.01em; }`;

const ALIAS_NOTES: Record<string, string> = {
  _hover: '悬停',
  _active: '按下',
  _focus: '获得焦点',
  _focusVisible: '键盘聚焦（焦点环）',
  _focusWithin: '自己或里面有焦点',
  _disabled: '不可用',
  _selected: '选中',
  _checked: '勾选',
  _indeterminate: '半选',
  _pressed: '按下的开关按钮',
  _expanded: '展开',
  _open: '打开（details、dialog、弹层）',
  _current: '当前项',
  _invalid: '校验不通过',
  _readonly: '只读',
  _highlighted: '键盘高亮的选项',
  _dragging: '拖动中',
  _placeholder: '占位文字',
  _forcedColors: '高对比模式',
  _reducedMotion: '减少动态效果',
  _rtl: '从右到左排版',
};

const styles = css.create({
  aliases: {
    display: 'grid',
    gridTemplateColumns: 'max-content max-content minmax(0, 1fr)',
    columnGap: '_md',
    rowGap: '_xs',
    margin: 0,
    fontSize: '_sm',
  },
  selector: { color: '_textMuted', overflowWrap: 'anywhere' },
});

export default _component(() => () => (
  <DocPage meta={meta}>
    <Flex direction="column" gap="md">
      <H2 id="basics" size="xl" anchor>
        写法
      </H2>
      <Paragraph>
        样式写在 <Code>css.create</Code> 里，原生元素用 <Code>css.attrs</Code> 展开、组件用{' '}
        <Code>sx</Code> 传；后写的按属性覆盖先写的，<Code>false</Code>、<Code>null</Code>{' '}
        会被忽略，按条件组合样式直接写 <Code>cond && styles.x</Code>
        。每个元素合成一个类，规则在第一次用到时插入页面。
      </Paragraph>
      <CodeBlock code={basics} lang="tsx" />
      <Alert tone="info" title="直接写主题 token">
        颜色、间距、圆角、阴影、动效都来自主题 token：值整个是 token 时写 <Code>'_md'</Code>{' '}
        这样的字符串（属性在对照表里时可以省掉组名，表外写 <Code>'_space.md'</Code>
        ），补全只列这一组，悬停能看到说明与取值；值里夹着 token 时写模板字符串里的{' '}
        <Code>t.组.名</Code>。写错的 token 在第一次用到那段样式时报错。
      </Alert>
    </Flex>
    <Example id="example" title="一组价格卡片" demo={StyleBasics}>
      样式、条件取值（<Code>:hover</Code>、<Code>@container</Code>）、token 短写、模板字符串里的{' '}
      <Code>t</Code>，以及直接写对象的 <Code>sx</Code>。
    </Example>

    <Flex direction="column" gap="md">
      <H2 id="states" size="xl" anchor>
        状态跟着 DOM 走
      </H2>
      <Paragraph>
        选中、展开、不可用这类状态本来就写在 DOM 上（<Code>aria-selected</Code>、
        <Code>data-state</Code>），样式用条件别名直接跟着它走，渲染里不必再按状态拼样式；使用方的{' '}
        <Code>sx</Code> 也能只改某个状态：
        <Code>{"{ color: { default: null, _selected: 'red' } }"}</Code>（<Code>null</Code>{' '}
        表示这个条件以外不改）。一个别名合并了原生、ARIA 与 data 几种写法：
      </Paragraph>
      <dl {...css.attrs(styles.aliases)}>
        {Object.entries(css.conditions).map(([alias, selector]) => [
          <dt>
            <Code>{alias}</Code>
          </dt>,
          <dd {...css.attrs({ margin: 0 })}>{ALIAS_NOTES[alias] ?? ''}</dd>,
          <dd {...css.attrs(styles.selector, { margin: 0 })}>
            <Code>{selector}</Code>
          </dd>,
        ])}
      </dl>
      <Paragraph>
        按另一个元素的状态取样式用 <Code>css.when</Code>：给被观察的元素挂一个{' '}
        <Code>css.defineMarker('名字')</Code>，子元素写{' '}
        <Code>{"[css.when.ancestor(':hover', marker)]: 1"}</Code>
        ；兄弟用 <Code>siblingBefore</Code>、<Code>siblingAfter</Code>、<Code>anySibling</Code>
        。不写组合符（<Code>+</Code>、<Code>~</Code>、<Code>&gt; *</Code>
        ）：一个元素的样式只由它自己的类描述，<Code>sx</Code>{' '}
        的覆盖才可预测；元素之间的间距用父元素的 <Code>gap</Code>。
      </Paragraph>
    </Flex>
    <Example id="states-example" title="文件夹列表" demo={StyleStates}>
      当前项、不可用、悬停、键盘聚焦都由 DOM 上的属性决定样式；行的底色按里面的按钮是不是当前项取（
      <Code>css.when.descendant</Code>），删除按钮按这一行的悬停与焦点显示（
      <Code>css.when.ancestor</Code>），都靠标记。
    </Example>

    <Flex direction="column" gap="md">
      <H2 id="dynamic" size="xl" anchor>
        随状态变的样式
      </H2>
      <Paragraph>
        <Code>create</Code> 里写成函数的是动态样式：
        <Code>{'bar: (width: number) => ({ width })'}</Code>
        。一直没变过的属性写进类里，值变过的转成元素上的 CSS 变量，之后值怎么变类名都不变。
      </Paragraph>
      <Paragraph>
        编译器会把渲染里随状态变的样式改成元素上的绑定：JSX 里调用本文件的动态样式（
        <Code>styles.bar(item.width)</Code>），以及交给 <Code>attrs</Code>、<Code>sx</Code> 的{' '}
        <Code>item.hot && styles.hot</Code>、<Code>cond ? styles.a : styles.b</Code>、
        <Code>styles[key]</Code>（读到的状态在渲染里没有别处用到时）。状态变化时由元素自己的 effect
        改变量、换类，组件不重新渲染；从别的文件导入的样式要这样做时手写{' '}
        <Code>css.bind(styles.bar, () =&gt; [width])</Code> 或{' '}
        <Code>css.select(() =&gt; cond && styles.x)</Code>。
      </Paragraph>
      <Alert tone="info" title="在 devtools 里看">
        这些更新不经过组件渲染，Vue devtools
        的组件更新里没有它们：开发模式下每次更新记在时间线的“样式绑定”一层（组件、元素、换了什么类、改了哪些变量）。值一直在变的（宽度、进度）用动态样式，不要写成对象的{' '}
        <Code>sx</Code>：每个新值都会多一条规则。
      </Alert>
    </Flex>
    <Example id="dynamic-example" title="任务进度" demo={StyleDynamic}>
      拖动滑块改每一行的进度、切换延期：变的是元素上的变量与类，行组件的渲染次数不变。
    </Example>

    <Flex direction="column" gap="md">
      <H2 id="customize" size="xl" anchor>
        定制组件
      </H2>
      <Paragraph>
        一处覆盖用 <Code>sx</Code>（组件的根元素）与 <Code>propsXxx.sx</Code>
        （部件，如 <Code>propsTitle</Code>）。整个应用或一块区域统一换样式用{' '}
        <Code>createUi({'{ styles }'})</Code> 与 <Code>{'<Provider styles>'}</Code>
        ：追加在组件自己的样式之后，可以改已有的档位、给新档位写样式；内层 Provider
        排在外层之后。每个部件都带 <Code>data-scope</Code> 与 <Code>data-part</Code>
        ，宿主自己的 CSS、端到端测试都能按部件选中，不依赖生成的类名。
      </Paragraph>
      <CodeBlock code={customize} lang="tsx" />
    </Flex>
    <Example id="customize-example" title="一块区域换个样子" demo={ComponentStyles}>
      右边那张卡片套了一层 <Code>Provider</Code>：组件自己有的选项改默认值（<Code>defaults</Code>
      ：按钮全圆、标记用描边浅底），选项以外的样式写进 <Code>styles</Code>
      （字距、描边按钮改成虚线、标记大写）。
    </Example>
  </DocPage>
));
