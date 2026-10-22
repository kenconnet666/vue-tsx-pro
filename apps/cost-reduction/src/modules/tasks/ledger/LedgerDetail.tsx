/**
 * 台账的详情行：表格里没有的信息——简要描述、各台账自己的明细摘要、里程碑与交付证据、关闭三材料。
 * 各段从左往右排：描述占剩下的宽度（24 到 40rem），其余各段按内容宽，放不下就换行
 */
import { Paperclip } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Icon, Link, Small } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';
import { missingClosing } from '../../../domain/task/status';
import type { CostTask } from '../../../domain/task/types';
import { Checklist, DetailSection } from '../../../shared/Progress';

const styles = stylex.create({
  detail: { display: 'flex', flexWrap: 'wrap', columnGap: '_xl', rowGap: '_md' },
  description: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_xs',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '24rem',
    minWidth: '16rem',
    maxWidth: '40rem',
  },
});

/** 详情行 */
export const LedgerDetail = _component(
  ({
    task,
    children,
  }: {
    task: CostTask;
    /** 描述之后、里程碑之前的明细摘要 */ children?: VNodeChild;
  }) =>
    () => {
      const done = task.milestones.filter((item) => item.done).length;
      const missing = missingClosing(task);
      return (
        <div {...stylex.attrs(styles.detail)}>
          <section {...stylex.attrs(styles.description)}>
            <Small tone="muted">简要描述</Small>
            <Small>{task.description}</Small>
          </section>
          {children}
          <DetailSection title={`里程碑与交付证据 · ${done} / 3`}>
            <Checklist
              items={task.milestones.map((item) => ({
                label: item.label,
                done: item.done != null,
                extra: item.done && (
                  <>
                    <Small tone="muted">{item.done}</Small>
                    {item.evidence && (
                      <Link
                        href="#"
                        title={item.evidence}
                        aria-label={`交付证据：${item.evidence}`}
                      >
                        <Icon icon={Paperclip} />
                      </Link>
                    )}
                  </>
                ),
              }))}
            />
          </DetailSection>
          <DetailSection
            title={`关闭三材料 · ${missing ? `缺 ${missing} 项，不能关闭` : '齐全，可以关闭'}`}
            tone={missing ? undefined : 'success'}
          >
            <Checklist
              items={[
                { label: '验证窗结论', done: task.closing.verification },
                { label: '收益认定意见', done: task.closing.benefit },
                { label: '商务谈定记录', done: task.closing.business },
              ]}
            />
          </DetailSection>
        </div>
      );
    },
);
