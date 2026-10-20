/**
 * 示例卡片工具栏上的“编辑”：打开代码演练场，带上这段源码（压缩进地址的 hash，见 playground/share.ts）。
 *
 *   <CodePreview code={demo.source} actions={<EditInPlayground code={demo.source} />}>…</CodePreview>
 */
import { SquarePen } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { LinkButton } from '@vue-tsx-pro/ui';
import { watch } from 'vue';
import { PLAYGROUND_PATH, playgroundHref } from '../playground/share';

/** 在演练场里编辑这段代码 */
export const EditInPlayground = _component(({ code }: { code: string }) => {
  // 压缩是异步的：算好之前先指向空白的演练场
  let href = _state(PLAYGROUND_PATH);
  watch(
    () => code,
    (source) =>
      void playgroundHref(source).then((result) => {
        // 期间代码又变了：留给最新的那次
        if (source === code) href = result;
      }),
    { immediate: true },
  );
  return () => (
    <LinkButton href={href} variant="ghost" tone="neutral" size="sm" icon={SquarePen}>
      编辑
    </LinkButton>
  );
});
