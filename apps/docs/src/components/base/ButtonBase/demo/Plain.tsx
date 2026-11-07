// 长得不像按钮的按钮：可展开的标题（整行是按钮，aria-expanded 关联下面的内容）与账号按钮（头像、名字、角色）。
// ButtonBase 只给行为、焦点环、波纹，外观由这里给出；要按钮外观时用 Button，要可选中的卡片时用 RadioGroup 的 card
import { ChevronDown, ChevronsUpDown } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Avatar,
  ButtonBase,
  Card,
  Collapse,
  disclosureStyles,
  Flex,
  Icon,
  Small,
  Strong,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  // 整行可点的标题：两端对齐，悬停时底色
  heading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_sm',
    width: '_full',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderRadius: '_md',
    backgroundColor: { default: 'transparent', _hover: '_fillHover' },
    textAlign: 'start',
  },
  body: { paddingInline: '_md', paddingBlockEnd: '_sm' },
  // 账号按钮：头像、两行文字、上下箭头
  account: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    width: '_full',
    maxWidth: '18rem',
    padding: '_sm',
    borderRadius: '_md',
    backgroundColor: { default: 'transparent', _hover: '_fillHover' },
    textAlign: 'start',
  },
  who: { flexGrow: 1, minWidth: 0 },
});

export default _component(() => {
  let open = _state(true);
  let switched = _state(0);
  return () => (
    <Flex direction="column" gap="md">
      <Card padding="xs">
        <ButtonBase
          sx={styles.heading}
          aria-expanded={open}
          aria-controls="plain-demo-body"
          onClick={() => (open = !open)}
        >
          <Strong>付款信息</Strong>
          <Icon icon={ChevronDown} sx={[disclosureStyles.icon, open && disclosureStyles.flip]} />
        </ButtonBase>
        <Collapse _open={open} propsContent={{ id: 'plain-demo-body' }}>
          <Text size="sm" sx={styles.body}>
            对公转账，收款账户与开票信息以合同为准；预付 30%，验收后 15 个工作日内付清。
          </Text>
        </Collapse>
      </Card>
      <ButtonBase sx={styles.account} onClick={() => switched++}>
        <Avatar name="林小满" size="sm" />
        <Flex direction="column" sx={styles.who}>
          <Strong>林小满</Strong>
          <Small tone="muted">采购部 · 管理员</Small>
        </Flex>
        <Icon icon={ChevronsUpDown} tone="muted" />
      </ButtonBase>
      <Small tone="muted">
        {switched ? `点了 ${switched} 次账号按钮（真实场景里打开账号菜单）` : '点账号按钮试试'}
      </Small>
    </Flex>
  );
});
