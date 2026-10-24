import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  Checkbox,
  Dialog,
  Flex,
  H3,
  Paragraph,
  ToggleGroup,
  ToggleItem,
  type DialogSizes,
} from '@vue-tsx-pro/ui';

const sections = [
  [
    '一、服务内容',
    '本服务为用户提供在线组件库文档、示例与代码演练场。我们会不断改进服务，可能增加或调整部分功能。',
  ],
  ['二、账号', '你需要对账号下的全部活动负责。发现账号被盗用时，请立即联系我们。'],
  ['三、隐私', '我们只收集提供服务所必需的信息，不会向第三方出售你的个人信息。详见隐私政策。'],
  ['四、内容', '你在演练场里写的代码归你所有。分享链接只把代码编码在地址里，不经过我们的服务器。'],
  ['五、责任限制', '示例代码按原样提供。用于生产环境前，请自行评估其适用性与安全性。'],
  ['六、变更', '条款更新时，我们会提前 30 天在站内公告。继续使用即视为同意更新后的条款。'],
];

// 页脚本身靠结束边排；勾选框放在起始边，要让这一行撑满页脚
const styles = css.create({ footer: { flexGrow: 1 } });

export default _component(() => {
  let open = _state(false);
  let size = _state<keyof DialogSizes>('md');
  let agreed = _state(false);
  return () => (
    <Flex direction="column" gap="md" align="start">
      <ToggleGroup value={_bind(size)} required size="sm" aria-label="宽度">
        {(['xs', 'sm', 'md', 'lg', 'full'] as const).map((value) => (
          <ToggleItem key={value} value={value}>
            {value}
          </ToggleItem>
        ))}
      </ToggleGroup>
      <Button variant="outline" onClick={() => (open = true)}>
        阅读用户协议（size="{size}"）
      </Button>
      <Dialog
        open={_bind(open)}
        size={size}
        title="用户协议"
        description="更新于 2026 年 10 月 1 日"
        footer={
          <Flex align="center" justify="between" gap="md" wrap sx={styles.footer}>
            <Checkbox checked={_bind(agreed)}>我已阅读并同意</Checkbox>
            <Button disabled={!agreed} onClick={() => (open = false)}>
              继续
            </Button>
          </Flex>
        }
      >
        <Flex direction="column" gap="lg">
          {[...sections, ...sections, ...sections].map(([title, text], index) => (
            <Flex key={index} direction="column" gap="xs">
              <H3 size="md">{title}</H3>
              <Paragraph size="sm">{text}</Paragraph>
            </Flex>
          ))}
        </Flex>
      </Dialog>
    </Flex>
  );
});
