/**
 * 项目详情的右栏：收益（预期、测算 A、商务 B、差额 D 与归因、金额口径）、里程碑与交付证据、关闭三材料
 */
import { CircleCheck, CircleDashed, Lock, Paperclip } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Card,
  Descriptions,
  Flex,
  H2,
  Icon,
  Link,
  Small,
  Text,
  useFormat,
} from '@vue-tsx-pro/ui';
import { dictLabel } from '../../../app/master';
import { gapOf } from '../../../domain/task/benefit';
import { missingClosing } from '../../../domain/task/status';
import type { CostTask } from '../../../domain/task/types';
import { costKinds } from '../../../shared/kinds';

const styles = stylex.create({
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '_sm' },
  // 收益：三个数一排，D 与归因在下面
  amounts: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '_sm' },
  amount: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  amountValue: { fontSize: '_xl', fontWeight: '_semibold', fontVariantNumeric: 'tabular-nums' },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  check: { display: 'flex', alignItems: 'center', gap: '_sm' },
  done: { color: '_successText', flexShrink: 0 },
  todo: { color: '_textMuted', flexShrink: 0 },
  grow: { flexGrow: 1, minWidth: 0 },
});

const checkIcon = (done: boolean) => (
  <Icon icon={done ? CircleCheck : CircleDashed} sx={done ? styles.done : styles.todo} />
);

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
        header={
          <div {...stylex.attrs(styles.cardHead)}>
            <H2 size="sm">收益（{amount.unit}）</H2>
            <Small tone="muted">口径：{dictLabel('amountBases', task.basis)}</Small>
          </div>
        }
      >
        <Flex direction="column" gap="md">
          <div {...stylex.attrs(styles.amounts)}>
            {(
              [
                ['预期', task.expected, false],
                ['测算 A', task.a, task.a != null],
                ['商务 B', task.b, false],
              ] as const
            ).map(([label, value, locked]) => (
              <div key={label} {...stylex.attrs(styles.amount)}>
                <Flex align="center" gap="xs">
                  <Small tone="muted">{label}</Small>
                  {locked && <Icon icon={Lock} size="sm" aria-label="已锁定" />}
                </Flex>
                <span {...stylex.attrs(styles.amountValue)}>
                  {value == null
                    ? task.status === 'unpriced' && label === '测算 A'
                      ? '待定价'
                      : '—'
                    : format.number(value, amount.format)}
                </span>
              </div>
            ))}
          </div>
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
    <ul {...stylex.attrs(styles.checklist)}>
      {task.milestones.map((item) => (
        <li key={item.label} {...stylex.attrs(styles.check)}>
          {checkIcon(item.done != null)}
          <Text size="sm" sx={styles.grow}>
            {item.label}
          </Text>
          {item.done ? (
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
          )}
        </li>
      ))}
    </ul>
  </Card>
));

/** 关闭三材料：验证窗结论、收益认定意见、商务谈定记录，缺一不得关闭 */
export const ClosingCard = _component(({ task }: { task: CostTask }) => () => {
  const missing = missingClosing(task);
  return (
    <Card
      variant="outline"
      header={
        <div {...stylex.attrs(styles.cardHead)}>
          <H2 size="sm">关闭三材料</H2>
          {missing ? (
            <Badge tone="warning">缺 {missing} 项</Badge>
          ) : (
            <Badge tone="success">齐全</Badge>
          )}
        </div>
      }
    >
      <ul {...stylex.attrs(styles.checklist)}>
        {(
          [
            ['验证窗结论', task.closing.verification],
            ['收益认定意见', task.closing.benefit],
            ['商务谈定记录', task.closing.business],
          ] as const
        ).map(([label, ok]) => (
          <li key={label} {...stylex.attrs(styles.check)}>
            {checkIcon(ok)}
            <Text size="sm" tone={ok ? undefined : 'muted'}>
              {label}
            </Text>
          </li>
        ))}
      </ul>
    </Card>
  );
});
