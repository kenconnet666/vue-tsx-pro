/**
 * 代码演练场（试点）：左边改代码，右边实时看效果。验证在浏览器里编译运行用户代码的可行性与代价，
 * 页面上直接显示 Worker 启动、每次编译、执行的耗时。还不是正式功能：不在侧栏里，地址是 /playground。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Alert, Badge, Flex, H1, Paragraph, Textarea } from '@vue-tsx-pro/ui';
import { h, shallowRef, watch, type Component } from 'vue';
import { applyStyles, compile, evaluate } from '../playground/run';
import { STARTER } from '../playground/starter';

const styles = stylex.create({
  layout: {
    display: 'grid',
    gap: '_xl',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 72rem)': 'minmax(0, 1fr) minmax(0, 1fr)',
    },
    alignItems: 'start',
  },
  editor: {
    fontFamily: '_mono',
    fontSize: '_sm',
    minHeight: '28rem',
  },
  // 编译错误带代码帧：保留换行与对齐
  error: { whiteSpace: 'pre-wrap', fontFamily: '_mono', fontSize: '_sm' },
  preview: {
    padding: '_xl',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    fontSize: '_md',
    lineHeight: '_normal',
  },
});

export default _component(() => {
  let code = _state(STARTER);
  const component = shallowRef<Component>();
  let error = _state('');
  let timing = _state({ compile: 0, run: 0, first: 0 });
  let runs = 0;
  const pageStart = performance.now();

  let timer: ReturnType<typeof setTimeout> | undefined;
  async function run(source: string) {
    const result = await compile(source);
    if ('error' in result) {
      error = result.error;
      return;
    }
    const start = performance.now();
    try {
      applyStyles(result.css);
      component.value = await evaluate(result.code);
      error = '';
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    }
    runs++;
    timing = {
      compile: Math.round(result.ms),
      run: Math.round(performance.now() - start),
      // 第一次：从打开页面到看到效果（含 Worker 下载与启动）
      first: runs === 1 ? Math.round(performance.now() - pageStart) : timing.first,
    };
  }
  // 停止输入 300ms 后重新编译
  watch(
    () => code,
    (source) => {
      clearTimeout(timer);
      timer = setTimeout(() => void run(source), 300);
    },
    { immediate: true },
  );

  return () => (
    <Flex direction="column" gap="lg">
      <H1>代码演练场（试点）</H1>
      <Paragraph tone="muted">
        在浏览器里编译运行：Web Worker 里用 Babel 依次去类型、编译符文、StyleX、Vue
        JSX，主线程执行并挂载。
      </Paragraph>
      <Flex gap="sm" wrap>
        <Badge>首次出效果 {timing.first} ms</Badge>
        <Badge>编译 {timing.compile} ms</Badge>
        <Badge>执行 {timing.run} ms</Badge>
      </Flex>
      <div {...stylex.attrs(styles.layout)}>
        <Textarea
          value={_bind(code)}
          aria-label="代码"
          spellcheck={false}
          propsRoot={{ sx: styles.editor }}
        />
        <div {...stylex.attrs(styles.preview)}>
          {error ? (
            <Alert tone="danger" title="出错了">
              <span {...stylex.attrs(styles.error)}>{error}</span>
            </Alert>
          ) : (
            component.value && h(component.value)
          )}
        </div>
      </div>
    </Flex>
  );
});
