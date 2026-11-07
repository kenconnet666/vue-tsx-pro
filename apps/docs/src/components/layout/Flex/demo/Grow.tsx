// grow：在父级的 flex 里占满剩余空间、可以收缩（里面的长文字才能截断）；inline：行内的 flex；
// GridList 的 rowGap / columnGap 分别覆盖 gap：附件列表行与行挨得近、列与列隔得开
import { CircleCheck, FileText } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Avatar,
  Badge,
  Card,
  Flex,
  GridList,
  Icon,
  Small,
  Strong,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';

const attachments = [
  ['采购合同（盖章版）.pdf', '2.4 MB'],
  ['报价单.xlsx', '86 KB'],
  ['发票.pdf', '312 KB'],
  ['验收单.pdf', '1.1 MB'],
  ['对账单.xlsx', '64 KB'],
  ['回款记录.csv', '12 KB'],
];

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Card padding="sm">
      <Flex align="center" gap="sm">
        <Avatar name="林小满" size="sm" />
        <Flex direction="column" grow>
          <Strong truncate>
            林小满上传了《第三季度经营分析报告（终版，含附录与数据来源说明）》
          </Strong>
          <Small tone="muted" truncate>
            设计中心 · 10 分钟前 · 来自网页端
          </Small>
        </Flex>
        <Badge tone="success">已审核</Badge>
      </Flex>
    </Card>
    <Text>
      状态：
      <Flex inline align="center" gap="xs">
        <Icon icon={CircleCheck} tone="success" />
        已通过
      </Flex>
      ，下一步由财务确认。
    </Text>
    <GridList minItemWidth="12rem" rowGap="xs" columnGap="lg" aria-label="附件">
      {attachments.map(([name, size]) => (
        <li key={name}>
          <Flex align="center" gap="xs">
            <Icon icon={FileText} tone="muted" />
            <Flex grow>
              <Small truncate>{name}</Small>
            </Flex>
            <Small tone="muted">{size}</Small>
          </Flex>
        </li>
      ))}
    </GridList>
  </Flex>
));
