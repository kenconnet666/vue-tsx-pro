/**
 * 代码演练场：左边改代码，右边实时看效果。
 *
 * - 编译在 Web Worker 里（playground/compile.ts），停止输入 300ms 后重新编译；执行与样式见 playground/run.ts
 * - 预览是独立的 Vue 应用（playground/preview.ts）：用户代码出错只在预览区报错，不影响页面
 * - 代码压缩后存在地址栏的 hash 里（playground/share.ts），复制链接就能分享；示例卡片的“编辑”也是这样带代码进来
 */
import { RotateCcw } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { breakpoints } from '@vue-tsx-pro/ui/tokens.stylex';
import { Alert, Button, CopyButton, Flex, Text, useConfig } from '@vue-tsx-pro/ui';
import { onBeforeUnmount, onMounted, watch, type Component } from 'vue';
import { CodeEditor } from '../playground/CodeEditor';
import { mountPreview } from '../playground/preview';
import { compile, evaluate } from '../playground/run';
import { decodeCode, encodeCode } from '../playground/share';
import { STARTER } from '../playground/starter';
import { DocPage } from '../site/DocPage';

const meta = {
  title: 'Playground 代码演练场',
  description:
    '在浏览器里改代码、立即看效果：符文、样式与主题 token、组件库、图标都能直接用。改动存在地址栏里，复制链接就能分享。',
};

const styles = stylex.create({
  layout: {
    display: 'grid',
    gap: '_xl',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      // 代码行比效果宽：编辑器多分一些
      [breakpoints.xl]: 'minmax(0, 3fr) minmax(0, 2fr)',
    },
    alignItems: 'start',
  },
  // 窄屏时编辑器矮一些，下面的效果不至于离得太远
  editor: { height: { default: '22rem', [breakpoints.xl]: '36rem' } },
  // 编辑器加载前占住同样的高度，加载后不跳动
  placeholder: {
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_surface',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_lg',
    minHeight: '12rem',
    padding: '_xl',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    // 预览里是界面字号（文章正文大一号）
    fontSize: '_md',
    lineHeight: '_normal',
  },
  // 错误信息带代码帧：保留换行与对齐
  error: { margin: 0, whiteSpace: 'pre-wrap', fontFamily: '_mono', fontSize: '_sm' },
});

/** 预览区显示的错误 */
interface PreviewError {
  title: string;
  message: string;
  /** 预览应用里出的错（渲染、事件处理）：可以重新挂载再试 */
  retry?: boolean;
}

const errorMessage = (cause: unknown) =>
  cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);

export default _component(() => {
  const config = useConfig();
  let code = _state('');
  // 地址栏里的代码读出来之前不显示编辑器
  let ready = _state(false);
  // 进入页面时的代码（分享链接或示例带来的，否则是起始示例）：“还原”回到它
  let original = _state(STARTER);
  let notice = _state('');
  let error = _state<PreviewError | null>(null);
  let timing = _state<{ compile: number; run: number } | null>(null);
  let previewHost = _state.raw<HTMLElement | null>(null);

  let component: Component | undefined;
  let unmountPreview: (() => void) | undefined;
  let compiled: string | undefined;
  let latest = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** 卸载旧的预览应用，挂载当前的组件 */
  function showPreview() {
    unmountPreview?.();
    unmountPreview = undefined;
    if (!component || !previewHost) return;
    unmountPreview = mountPreview(previewHost, component, {
      config,
      onError: (cause) =>
        (error = { title: '运行出错', message: errorMessage(cause), retry: true }),
    });
  }

  async function run(source: string) {
    if (source === compiled) return;
    compiled = source;
    // 打字很快时只用最后一次的结果
    const id = ++latest;
    const result = await compile(source).catch((cause: unknown) => ({
      error: errorMessage(cause),
      ms: 0,
    }));
    if (id !== latest) return;
    // 编译出错时保留上一次的效果，改好后再换
    if ('error' in result) {
      error = { title: '编译出错', message: result.error };
      return;
    }
    const start = performance.now();
    try {
      const next = await evaluate(result.code);
      if (id !== latest) return;
      component = next;
      error = null;
      showPreview();
    } catch (cause) {
      error = { title: '运行出错', message: errorMessage(cause) };
    }
    timing = { compile: Math.round(result.ms), run: Math.round(performance.now() - start) };
  }

  /** 代码写进地址栏（不新增历史记录）；是起始示例时去掉 hash */
  async function syncAddress(source: string) {
    const hash = source === STARTER ? '' : await encodeCode(source);
    history.replaceState(history.state, '', hash || location.pathname + location.search);
  }

  /** 从地址栏读代码：进入页面、前进后退时 */
  async function load() {
    try {
      original = (await decodeCode(location.hash)) ?? STARTER;
      notice = '';
    } catch {
      original = STARTER;
      notice = '链接里的代码读不出来（可能复制时被截断了），先显示起始示例。';
    }
    code = original;
    ready = true;
    void run(code);
  }
  void load();

  watch(
    () => code,
    (source) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void run(source);
        void syncAddress(source);
      }, 300);
    },
  );

  const onPopstate = () => void load();
  onMounted(() => {
    window.addEventListener('popstate', onPopstate);
    showPreview();
  });
  onBeforeUnmount(() => {
    window.removeEventListener('popstate', onPopstate);
    clearTimeout(timer);
    unmountPreview?.();
  });

  return () => (
    <DocPage meta={meta} wide>
      <Flex direction="column" gap="md">
        {notice && (
          <Alert tone="warning" onClose={() => (notice = '')}>
            {notice}
          </Alert>
        )}
        <Flex justify="between" align="center" gap="sm" wrap>
          <Text tone="muted">
            {timing ? `编译 ${timing.compile} ms · 执行 ${timing.run} ms` : '正在加载编译器…'}
          </Text>
          <Flex gap="xs" align="center">
            <Button
              variant="ghost"
              tone="neutral"
              size="sm"
              icon={RotateCcw}
              disabled={code === original}
              onClick={() => (code = original)}
            >
              还原
            </Button>
            <CopyButton value={() => location.href} aria-label="复制分享链接" size="sm" />
          </Flex>
        </Flex>
        <div {...stylex.attrs(styles.layout)}>
          {ready ? (
            <CodeEditor value={_bind(code)} aria-label="代码" sx={styles.editor} />
          ) : (
            <div {...stylex.attrs(styles.editor, styles.placeholder)} />
          )}
          <div role="region" aria-label="效果" {...stylex.attrs(styles.preview)}>
            {error && (
              <Alert
                tone="danger"
                title={error.title}
                action={
                  error.retry && (
                    <Button
                      size="sm"
                      variant="soft"
                      tone="neutral"
                      onClick={() => {
                        error = null;
                        showPreview();
                      }}
                    >
                      重新运行
                    </Button>
                  )
                }
              >
                <pre {...stylex.attrs(styles.error)}>{error.message}</pre>
              </Alert>
            )}
            <div key="preview" ref={_toRef(previewHost)} />
          </div>
        </div>
      </Flex>
    </DocPage>
  );
});
