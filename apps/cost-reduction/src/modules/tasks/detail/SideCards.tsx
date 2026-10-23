/**
 * 项目详情的右栏：收益（预期、测算 A、商务 B、差额 D 与归因、金额口径）、里程碑与交付证据、关闭三材料
 */
import { Lock, Paperclip } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Card,
  Descriptions,
  Flex,
  Grid,
  H2,
  Icon,
  Link,
  Small,
  Stat,
  useFormat,
} from '@vue-tsx-pro/ui';
import { Checklist } from '../../../shared/Checklist';
import { dictLabel } from '../../../app/master';
import { gapOf } from '../../../domain/task/benefit';
import { missingClosing } from '../../../domain/task/status';
import type { CostTask } from '../../../domain/task/types';
import { costKinds } from '../../../shared/kinds';

/** 收益：预期、测算 A（锁定后不可改）、商务 B，差额 D 与归因、测算版本 */
export const BenefitCard = _component(({ task }: { task: CostTask }) => {
  const format = useFormat();
  return () => {
    const amount = costKinds[task.kind];
    const money = (value: Parameters<typeof format.number>[0]) =>
      `${format.number(value, amount.format)} ${amount.unit}`;
    const gap = gapOf(task);
    return (
      <Card
        variant="outline"
        header={<H2 size="sm">收益（{amount.unit}）</H2>}
        extra={<Small tone="muted">口径：{dictLabel('amountBases', task.basis)}</Small>}
      >
        <Flex direction="column" gap="md">
          {/* 三个数一排，D 与归因在下面 */}
          <Grid columns={3} gap="sm">
            {(
              [
                ['预期', task.expected, false],
                ['测算 A', task.a, task.a != null],
                ['商务 B', task.b, false],
              ] as const
            ).map(([label, value, locked]) => (
              <Stat
                key={label}
                label={
                  <Flex inline align="center" gap="xs">
                    {label}
                    {locked && <Icon icon={Lock} size="sm" aria-label="已锁定" />}
                  </Flex>
                }
                value={value ?? (task.status === 'unpriced' && label === '测算 A' ? '待定价' : '—')}
                format={amount.format}
              />
            ))}
          </Grid>
          <Descriptions
            size="sm"
            columns={1}
            items={[
              {
                label: '差额 D（B − A）',
                value: gap ? `${money(gap)} · ${task.gapReason ?? '未归因'}` : '—',
              },
              {
                label: '测算版本',
                value: task.a ? 'V2（认定时锁定），V1 为建议卡上的预期' : 'V1（建议卡上的预期）',
              },
            ]}
          />
        </Flex>
      </Card>
    );
  };
});

/** 里程碑与交付证据：每个里程碑都要上传证据，不允许只改状态 */
export const MilestonesCard = _component(({ task }: { task: CostTask }) => () => (
  <Card variant="outline" header={<H2 size="sm">里程碑与交付证据</H2>}>
    <Checklist
      items={task.milestones.map((item) => ({
        label: item.label,
        done: item.done != null,
        extra: item.done ? (
          <>
            <Small tone="muted">{item.done}</Small>
            {item.evidence && (
              <Link href="#" title={item.evidence} aria-label={`交付证据：${item.evidence}`}>
                <Icon icon={Paperclip} />
              </Link>
            )}
          </>
        ) : (
          <Small tone="muted">未完成</Small>
        ),
      }))}
    />
  </Card>
));

/** 关闭三材料：验证窗结论、收益认定意见、商务谈定记录，缺一不得关闭 */
export const ClosingCard = _component(({ task }: { task: CostTask }) => () => {
  const missing = missingClosing(task);
  return (
    <Card
      variant="outline"
      header={<H2 size="sm">关闭三材料</H2>}
      extra={
        missing ? <Badge tone="warning">缺 {missing} 项</Badge> : <Badge tone="success">齐全</Badge>
      }
    >
      <Checklist
        items={[
          { label: '验证窗结论', done: task.closing.verification },
          { label: '收益认定意见', done: task.closing.benefit },
          { label: '商务谈定记录', done: task.closing.business },
        ]}
      />
    </Card>
  );
});
