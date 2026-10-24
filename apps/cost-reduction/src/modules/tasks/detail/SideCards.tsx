/**
 * 项目详情的右栏：收益（预期、测算 A、商务 B、差额 D 与归因、金额口径）、里程碑与交付证据、关闭三材料
 */
import { Lock, Paperclip } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Card,
  Checklist,
  Descriptions,
  Flex,
  Grid,
  H2,
  Icon,
  Link,
  Small,
  Stat,
  useFormat,
  type ChecklistItem,
} from '@vue-tsx-pro/ui';
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
      summary
      items={task.milestones.map((item) => ({
        label: item.label,
        status: item.done ? 'done' : 'todo',
        date: item.done,
        evidence: item.evidence && (
          <Link href="#" title={item.evidence} aria-label={`交付证据：${item.evidence}`}>
            <Icon icon={Paperclip} />
          </Link>
        ),
      }))}
    />
  </Card>
));

/** 关闭三材料的清单项：缺的写清由谁出具 */
export const closingItems = (task: CostTask): ChecklistItem[] =>
  (
    [
      ['验证窗结论', task.closing.verification, '验证负责人'],
      ['收益认定意见', task.closing.benefit, '成本团队'],
      ['商务谈定记录', task.closing.business, '采购部'],
    ] as const
  ).map(([label, done, owner]) => ({
    label,
    status: done ? 'done' : 'todo',
    owner: done ? undefined : `由${owner}出具`,
  }));

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
      <Checklist items={closingItems(task)} />
    </Card>
  );
});
