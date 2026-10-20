import { Filter, Share2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  CopyButton,
  Flex,
  Popover,
  Small,
  Strong,
  Switch,
  TextField,
} from '@vue-tsx-pro/ui';

const statuses = ['待付款', '备货中', '已发货', '已完成', '已退款'];

const styles = stylex.create({ share: { width: '20rem' } });

export default _component(() => {
  let sharing = _state(false);
  let filtering = _state(false);
  let comments = _state(true);
  let picked = _state<string[]>(['待付款', '备货中']);
  let applied = _state<string[]>([..._untrack(picked)]);
  const link = 'https://example.com/s/q3-report';

  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex gap="sm" wrap>
        <Popover
          open={_bind(sharing)}
          placement="bottom-start"
          arrow
          trigger={(props) => (
            <Button {...props} icon={Share2}>
              分享
            </Button>
          )}
        >
          <Flex direction="column" gap="md" sx={styles.share}>
            <Strong>分享“第三季度报告”</Strong>
            <Flex gap="xs">
              <TextField value={link} readonly aria-label="分享链接" />
              <CopyButton value={link} />
            </Flex>
            <Switch checked={_bind(comments)}>允许查看者评论</Switch>
          </Flex>
        </Popover>
        <Popover
          open={_bind(filtering)}
          placement="bottom-start"
          trigger={(props) => (
            <Button {...props} variant="outline" tone="neutral" icon={Filter}>
              订单状态{applied.length > 0 && `（${applied.length}）`}
            </Button>
          )}
        >
          <Flex direction="column" gap="md">
            <CheckboxGroup value={_bind(picked)} aria-label="订单状态">
              {statuses.map((status) => (
                <Checkbox key={status} value={status}>
                  {status}
                </Checkbox>
              ))}
            </CheckboxGroup>
            <Flex gap="sm" justify="end">
              <Button size="sm" variant="ghost" tone="neutral" onClick={() => (picked = [])}>
                清空
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  applied = [...picked];
                  filtering = false;
                }}
              >
                应用
              </Button>
            </Flex>
          </Flex>
        </Popover>
      </Flex>
      <Small tone="muted">筛选：{applied.join('、') || '全部状态'}</Small>
    </Flex>
  );
});
