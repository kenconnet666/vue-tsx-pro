// 浮层与反馈：弹出层、动作面板、对话框、轻提示、顶部通知、滑动单元格、下拉刷新、骨架屏；三端同一份页面
import { Archive, Share2, Star } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  ActionSheet,
  Button,
  Cell,
  CellGroup,
  ConfigProvider,
  Dialog,
  Popup,
  PullRefresh,
  Skeleton,
  Space,
  SwipeCell,
  showConfirmDialog,
  showDialog,
  showFailToast,
  showLoadingToast,
  showNotify,
  showSuccessToast,
  showToast,
  type ActionSheetAction,
  type PopupPositions,
} from '@zerodep-dev/vue-tsx-pro-mobile';

const styles = css.create({
  page: { minHeight: '100vh', paddingBlockEnd: '_xxl', backgroundColor: '_background' },
  section: { paddingInline: '_lg', paddingBlock: '_md', backgroundColor: '_surface' },
  hint: { paddingInline: '_lg', paddingBlock: '_sm', fontSize: '_xs', color: '_textMuted' },
  sheet: { paddingInline: '_lg', paddingBlock: '_xl', lineHeight: '1.6' },
  side: { paddingInline: '_lg', paddingBlock: '_xxl', minWidth: '12em' },
  swipeAction: { height: '100%', borderRadius: '_none' },
  article: { display: 'flex', gap: '_lg', paddingInline: '_lg', paddingBlock: '_sm' },
  avatar: {
    flex: 'none',
    width: '2.5em',
    height: '2.5em',
    borderRadius: '_full',
    backgroundColor: '_accentSoft',
  },
  articleTitle: { fontWeight: '_semibold', marginBlockEnd: '0.3em' },
  articleText: { fontSize: '_sm', color: '_textMuted', lineHeight: '1.6' },
});

const SHARE: ActionSheetAction[] = [
  { name: '微信好友', icon: Share2 },
  { name: '朋友圈', description: '仅自己可见时不能分享', disabled: true },
  { name: '收藏', icon: Star },
  { name: '删除', tone: 'danger', description: '删除后不能恢复' },
];

const POSITIONS: [keyof PopupPositions, string][] = [
  ['bottom', '底部弹出'],
  ['center', '中间弹出'],
  ['top', '顶部弹出'],
  ['left', '左侧滑入'],
  ['right', '右侧滑入'],
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const FeedbackPage = _component(() => {
  let popup = _state(false);
  // 关闭后保留上一次的位置：离场动画还要按它播完
  let position = _state<keyof PopupPositions>('bottom');
  let sheet = _state(false);
  let dialog = _state(false);
  let refreshing = _state(false);
  let refreshed = _state(0);
  let skeleton = _state(true);
  let orders = _state(['订单 1024 · 待付款', '订单 1025 · 待发货', '订单 1026 · 已完成']);

  const confirmDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: '删除地址',
      message: '删除后不能恢复，确定删除吗？',
      confirmText: '删除',
      confirmTone: 'danger',
    });
    showToast(confirmed ? '已删除' : '已取消');
  };
  const submit = async () => {
    const toast = showLoadingToast('提交中…');
    await wait(1200);
    toast.close();
    showSuccessToast('提交成功');
  };
  const refresh = async () => {
    await wait(1000);
    refreshed++;
  };

  return () => (
    <ConfigProvider {...css.attrs(styles.page)}>
      <PullRefresh _refreshing={refreshing} onRefresh={refresh} successText="刷新成功">
        <div {...css.attrs(styles.hint)}>在页面顶部往下拉可以刷新（已刷新 {refreshed} 次）</div>

        <CellGroup title="弹出层">
          {POSITIONS.map(([where, label]) => (
            <Cell
              title={label}
              arrow
              onClick={() => {
                position = where;
                popup = true;
              }}
            />
          ))}
        </CellGroup>

        <CellGroup title="动作面板与对话框">
          <Cell title="分享到…" arrow onClick={() => (sheet = true)} />
          <Cell
            title="提示对话框"
            arrow
            onClick={() => showDialog({ title: '提示', message: '订单已提交，商家会尽快发货。' })}
          />
          <Cell title="确认对话框（危险操作）" arrow onClick={confirmDelete} />
          <Cell title="异步确认（按钮转圈）" arrow onClick={() => (dialog = true)} />
        </CellGroup>

        <CellGroup title="轻提示">
          <div {...css.attrs(styles.section)}>
            <Space wrap>
              <Button size="sm" variant="soft" onClick={() => showToast('已复制到剪贴板')}>
                文字
              </Button>
              <Button size="sm" variant="soft" onClick={submit}>
                加载中
              </Button>
              <Button
                size="sm"
                variant="soft"
                tone="success"
                onClick={() => showSuccessToast('保存成功')}
              >
                成功
              </Button>
              <Button
                size="sm"
                variant="soft"
                tone="danger"
                onClick={() => showFailToast('网络不太好')}
              >
                失败
              </Button>
              <Button
                size="sm"
                variant="outline"
                tone="neutral"
                onClick={() => showToast({ message: '在顶部显示', position: 'top' })}
              >
                靠上
              </Button>
            </Space>
          </div>
        </CellGroup>

        <CellGroup title="顶部通知">
          <div {...css.attrs(styles.section)}>
            <Space wrap>
              <Button size="sm" tone="danger" onClick={() => showNotify('网络连接已断开')}>
                错误
              </Button>
              <Button
                size="sm"
                tone="success"
                onClick={() => showNotify({ message: '资料已保存', tone: 'success' })}
              >
                成功
              </Button>
              <Button
                size="sm"
                tone="warning"
                onClick={() => showNotify({ message: '余额不足，请尽快充值', tone: 'warning' })}
              >
                警告
              </Button>
              <Button
                size="sm"
                onClick={() => showNotify({ message: '有 3 条新消息', tone: 'accent' })}
              >
                提示
              </Button>
            </Space>
          </div>
        </CellGroup>

        <CellGroup title="滑动单元格（左滑删除、右滑归档）">
          {orders.map((order) => (
            <SwipeCell
              left={
                <Button tone="accent" icon={Archive} sx={styles.swipeAction}>
                  归档
                </Button>
              }
              right={[
                <Button tone="warning" sx={styles.swipeAction}>
                  收藏
                </Button>,
                <Button
                  tone="danger"
                  sx={styles.swipeAction}
                  onClick={() => (orders = orders.filter((item) => item !== order))}
                >
                  删除
                </Button>,
              ]}
            >
              <Cell title={order} value="详情" />
            </SwipeCell>
          ))}
        </CellGroup>

        <CellGroup title="骨架屏">
          <div {...css.attrs(styles.section)}>
            <Button
              size="sm"
              variant="outline"
              tone="neutral"
              onClick={() => (skeleton = !skeleton)}
            >
              {skeleton ? '加载完成' : '重新加载'}
            </Button>
          </div>
          <Skeleton loading={skeleton} avatar title rows={3}>
            <div {...css.attrs(styles.article)}>
              <div {...css.attrs(styles.avatar)} />
              <div>
                <div {...css.attrs(styles.articleTitle)}>移动端组件库进展</div>
                <div {...css.attrs(styles.articleText)}>
                  浮层、反馈与手势组件已经在 H5、微信、支付宝三端跑通，同一份页面代码。
                </div>
              </div>
            </div>
          </Skeleton>
        </CellGroup>
      </PullRefresh>

      <Popup _open={popup} position={position} round closeable>
        <div
          {...css.attrs(position === 'left' || position === 'right' ? styles.side : styles.sheet)}
        >
          弹出层的内容。点遮罩或右上角的关闭按钮关闭。
        </div>
      </Popup>
      <ActionSheet
        _open={sheet}
        title="分享到"
        actions={SHARE}
        onSelect={(action) => showToast(`选了：${String(action.name)}`)}
        onOpenChange={(open) => (sheet = open)}
      />
      <Dialog
        _open={dialog}
        title="提交订单"
        message="确认后会立即扣款。"
        showCancel
        onConfirm={() => wait(1200).then(() => showSuccessToast('已提交'))}
        onOpenChange={(open) => (dialog = open)}
      />
    </ConfigProvider>
  );
});
