import { ShoppingCart, Star } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  ButtonBase,
  Flex,
  Icon,
  Link,
  Small,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  VisuallyHidden,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { onMounted, type VNodeChild } from 'vue';

// 粗略模拟读屏读出的文字：跳过 aria-hidden，有 aria-label 时读 aria-label
function spokenText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true') return '';
  return node.getAttribute('aria-label') ?? [...node.childNodes].map(spokenText).join('');
}

const samples: { usage: string; view: () => VNodeChild }[] = [
  {
    usage: '数字的含义',
    view: () => (
      <ButtonBase>
        <Flex gap="xs" align="center">
          <Icon icon={ShoppingCart} />
          <Badge size="sm" variant="solid" tone="danger" radius="full">
            3
          </Badge>
          <VisuallyHidden>件商品，打开购物车</VisuallyHidden>
        </Flex>
      </ButtonBase>
    ),
  },
  {
    usage: '图形化的评分',
    view: () => (
      <Flex gap="xs" align="center">
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} icon={Star} tone={n <= 4 ? 'warning' : 'muted'} />
        ))}
        <VisuallyHidden>4 星，满分 5 星</VisuallyHidden>
        <Small tone="muted">（128）</Small>
      </Flex>
    ),
  },
  {
    usage: '外部链接（Link 内置）',
    view: () => (
      <Link href="https://vuejs.org" external>
        Vue 文档
      </Link>
    ),
  },
  {
    usage: '省略的单位',
    view: () => (
      <span>
        ¥ 99 / 月<VisuallyHidden>（每月 99 元，按年付费）</VisuallyHidden>
      </span>
    ),
  },
];

export default _component(() => {
  let root = _state.raw<HTMLElement | null>(null);
  let spoken = _state.raw<string[]>([]);

  onMounted(() => {
    const cells = root?.querySelectorAll('[data-sample]') ?? [];
    spoken = [...cells].map((cell) => spokenText(cell).replace(/\s+/g, ' ').trim());
  });

  return () => (
    <div ref={_toRef(root)}>
      <Table aria-label="VisuallyHidden 的用法">
        <TableHead>
          <TableRow>
            <TableHeaderCell>用途</TableHeaderCell>
            <TableHeaderCell>看到的</TableHeaderCell>
            <TableHeaderCell>读屏读到的</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {samples.map(({ usage, view }, i) => (
            <TableRow key={usage}>
              <TableCell nowrap>{usage}</TableCell>
              <TableCell data-sample="">{view()}</TableCell>
              <TableCell>
                <Small tone="muted">{spoken[i]}</Small>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
