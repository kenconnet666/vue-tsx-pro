// 帮助文档页的右下角：客服（带未读数）、反馈，滚下去后组里多出“回到顶部”
import { MessageCircle, MessageSquareText } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  BackTop,
  Card,
  FloatButton,
  FloatButtonGroup,
  H4,
  Paragraph,
  ScrollArea,
  Small,
} from '@zerodep-dev/vue-tsx-pro-ui';

const sections = [
  ['开通账号', '管理员在“成员”里邀请同事，对方用邮件里的链接设置密码后即可登录。'],
  ['导入数据', '支持 Excel 与 CSV，第一行是列名；导入前可以预览，出错的行会单独列出。'],
  ['设置审批', '每类单据可以配置多级审批，金额超过阈值时自动加签财务负责人。'],
  ['对接系统', '开放接口用应用密钥签名，回调地址需要在“集成”里登记并通过校验。'],
  ['导出报表', '报表按筛选条件导出，超过一万行时改为后台生成，完成后站内通知。'],
];

export default _component(() => {
  let panel = _state.raw<HTMLElement | null>(null);
  let unread = _state(2);
  return () => (
    // 示例框是固定定位的包含块（contain: layout）：按钮停在框的角落，页面里用时就是视口的角落
    <Card padding="none" style={{ contain: 'layout', overflow: 'hidden' }}>
      <ScrollArea
        style={{ height: '20rem' }}
        propsViewport={{ ref: (element: unknown) => (panel = element as HTMLElement | null) }}
      >
        <article style={{ padding: '1em 1.25em 4em', display: 'grid', gap: '1em' }}>
          <Small tone="muted">往下滚：组里多出“回到顶部”</Small>
          {sections.map(([title, text]) => (
            <section key={title}>
              <H4>{title}</H4>
              <Paragraph>{text}</Paragraph>
              <Paragraph tone="muted">{text}</Paragraph>
            </section>
          ))}
        </article>
      </ScrollArea>
      <FloatButtonGroup aria-label="帮助">
        <FloatButton
          icon={MessageCircle}
          aria-label={unread ? `联系客服（${unread} 条未读）` : '联系客服'}
          tooltip="联系客服"
          badge={unread || undefined}
          onClick={() => (unread = 0)}
        />
        <FloatButton icon={MessageSquareText} aria-label="意见反馈" />
        <BackTop target={() => panel} threshold={160} />
      </FloatButtonGroup>
    </Card>
  );
});
