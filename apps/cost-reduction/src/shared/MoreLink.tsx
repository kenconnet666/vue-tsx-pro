/**
 * 去别处看的小链接：“全部 ↗”“去处理 ↗”“看一本账 ↗”，放在卡片页头的 extra、指标的脚注里
 */
import { ArrowUpRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Icon, Link } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';

/** 去别处看的小链接 */
export const MoreLink = _component(
  ({ href, children }: { href: string; children?: VNodeChild }) =>
    () => (
      <Link href={href}>
        {children}
        <Icon icon={ArrowUpRight} />
      </Link>
    ),
);
