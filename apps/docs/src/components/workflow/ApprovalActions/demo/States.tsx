// 流程暂停时不能处理（disabled）；紧凑尺寸放在表格行、收件箱的预览里；propsButton 按结果改某个按钮（加图标）
import { Check, CornerUpLeft, X } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Card, Flex, Small } from '@vue-tsx-pro/ui';
import { ApprovalActions, type ProcessOutcome } from '@vue-tsx-pro/ui/workflow';

const outcomes: ProcessOutcome[] = [
  { key: 'pass', label: '齐全' },
  { key: 'back', label: '退回补充', kind: 'return', comment: 'required' },
  { key: 'stop', label: '终止', kind: 'terminate', comment: 'required' },
];

const icons = { pass: Check, back: CornerUpLeft, stop: X } as const;

export default _component(() => () => (
  <Card>
    <Flex direction="column" gap="lg">
      <Flex direction="column" gap="xs">
        <Flex align="center" gap="sm">
          <Small>齐全性检查</Small>
          <Badge tone="warning">流程已暂停</Badge>
        </Flex>
        <ApprovalActions node="齐全性检查" outcomes={outcomes} disabled onComplete={() => {}} />
      </Flex>
      <Flex direction="column" gap="xs">
        <Small tone="muted">紧凑尺寸，按结果加图标</Small>
        <ApprovalActions
          node="齐全性检查"
          size="sm"
          outcomes={outcomes}
          propsButton={(outcome) => ({ icon: icons[outcome.key as keyof typeof icons] })}
          onComplete={() => {}}
        />
      </Flex>
    </Flex>
  </Card>
));
