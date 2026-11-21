// 一个小 IDE：左边文件和大纲，右边属性，下边的运行输出点"运行"时才出来；收起工具窗口时中间的编辑区不重建
import { FileText, ListTree, Play, ScrollText, SlidersHorizontal } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Button, Code, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import {
  defaultWorkbenchLayout,
  Workbench,
  type WorkbenchLayout,
  type WorkbenchWindow,
} from '@zerodep-dev/vue-tsx-pro-ui/patterns';

const styles = css.create({
  frame: {
    height: '24rem',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    overflow: 'hidden',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    paddingInline: '_sm',
    minHeight: '2.25rem',
    borderBlockEndWidth: 1,
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
  },
  run: { marginInlineStart: 'auto' },
  editor: { padding: '_md', fontFamily: '_mono' },
  list: { padding: '_sm', margin: 0, listStyle: 'none' },
  pane: { display: 'block', padding: '_sm' },
});

export default _component(() => {
  let running = _state(false);
  const windows = (): WorkbenchWindow[] => [
    {
      id: 'files',
      title: '文件',
      icon: FileText,
      anchor: 'left',
      content: () => (
        <ul {...css.attrs(styles.list)}>
          <li>main.ts</li>
          <li>Button.tsx</li>
        </ul>
      ),
    },
    {
      id: 'outline',
      title: '大纲',
      icon: ListTree,
      anchor: 'leftBottom',
      content: () => (
        <ul {...css.attrs(styles.list)}>
          <li>Button</li>
          <li>onClick</li>
        </ul>
      ),
    },
    {
      id: 'props',
      title: '属性',
      icon: SlidersHorizontal,
      anchor: 'right',
      detail: 'Button.tsx',
      content: () => (
        <Small tone="muted" sx={styles.pane}>
          选中的对象的属性
        </Small>
      ),
    },
    {
      id: 'output',
      title: '运行',
      icon: ScrollText,
      anchor: 'bottom',
      available: running,
      showWhenAvailable: true,
      actions: () => (
        <Button size="sm" variant="ghost" onClick={() => (running = false)}>
          停止
        </Button>
      ),
      content: () => (
        <div {...css.attrs(styles.pane)}>
          <Code>vite ready in 312 ms</Code>
        </div>
      ),
    },
  ];
  let layout = _state<WorkbenchLayout>(defaultWorkbenchLayout(windows()));
  return () => (
    <Workbench
      sx={styles.frame}
      windows={windows()}
      _layout={layout}
      header={
        <div {...css.attrs(styles.bar)}>
          <strong>演示项目</strong>
          <Button
            sx={styles.run}
            size="sm"
            icon={Play}
            disabled={running}
            onClick={() => (running = true)}
          >
            运行
          </Button>
        </div>
      }
    >
      <div {...css.attrs(styles.editor)}>{'export const Button = () => …'}</div>
    </Workbench>
  );
});
