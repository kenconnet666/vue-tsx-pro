/**
 * 示例卡片工具栏上的“编辑”：打开代码演练场，带上这段源码（压缩进地址的 hash，见 playground/share.ts）。
 *
 *   <CodePreview code={demo.source} actions={<EditInPlayground code={demo.source} />}>…</CodePreview>
 *
 * 卡片大多不会被编辑：指针移到、焦点落到按钮上时才加载源码、压缩出地址（不是一挂载就为每张卡片算一遍）；
 * 点得比算得快时等算好再跳转。
 */
import { SquarePen } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { LinkButton } from '@zerodep-dev/vue-tsx-pro-ui';
import { useRouter } from 'vue-router';
import { PLAYGROUND_PATH, playgroundHref } from '../playground/share';

/** EditInPlayground 的属性 */
export interface EditInPlaygroundProps {
  /** 源码，或按需加载源码的函数（示例的 demo.source） */
  code: string | (() => Promise<string>);
}

/** 在演练场里编辑这段代码 */
export const EditInPlayground = _component(({ code }: EditInPlaygroundProps) => {
  const router = useRouter();
  let href = _state<string | null>(null);
  let computedFor: unknown;
  let pending: Promise<string> | undefined;

  /** 算出（同一份源码只算一次）带源码的演练场地址 */
  function compute(): Promise<string> {
    if (computedFor === code && pending) return pending;
    const from = code;
    computedFor = from;
    href = null;
    pending = (typeof from === 'string' ? Promise.resolve(from) : from())
      .then(playgroundHref)
      .then((result) => {
        if (computedFor === from) href = result;
        return result;
      });
    // 压缩失败（页面卸载时流被中止）：链接留在空白的演练场
    pending.catch(() => undefined);
    return pending;
  }

  function onClick(event: MouseEvent) {
    if (href) return;
    // 还没算好：拦下这次跳转，算好再去
    event.preventDefault();
    void compute().then(
      (result) => router.push(result),
      () => router.push(PLAYGROUND_PATH),
    );
  }

  return () => (
    <LinkButton
      href={href ?? PLAYGROUND_PATH}
      variant="ghost"
      tone="neutral"
      size="sm"
      icon={SquarePen}
      onPointerenter={() => void compute()}
      onFocus={() => void compute()}
      onClick={onClick}
    >
      编辑
    </LinkButton>
  );
});
