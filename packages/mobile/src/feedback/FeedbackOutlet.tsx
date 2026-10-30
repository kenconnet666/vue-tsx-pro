/**
 * 命令式反馈的出口：showToast、showDialog、showNotify 改的是模块里的状态，这里把它们渲染出来；
 * 平台要求同意隐私协议时的弹窗（PrivacyPrompt）也在这里。
 * ConfigProvider 自动渲染一个；小程序里每个页面都有自己的一个（页面栈里看不见的页面渲染了也看不到）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { PrivacyPrompt } from '../capability/PrivacyPrompt';
import { Dialog, dialogState, settleDialog } from './Dialog';
import { Notify, notifyState } from './Notify';
import { Toast, toastState } from './Toast';

/** 命令式反馈的出口：轻提示、对话框、顶部通知、隐私协议 */
export const FeedbackOutlet = _component(() => () => {
  const dialog = dialogState.queue[0];
  return [
    // 对象属性的 _open 双向绑定：到时间自动关闭时写回状态
    <Toast {...toastState.options} _open={toastState.open} />,
    <Notify {...notifyState.options} _open={notifyState.open} />,
    dialog && (
      <Dialog
        {...dialog.options}
        _open={dialogState.open}
        onOpenChange={(_open, { reason }) => settleDialog(reason === 'confirm')}
      />
    ),
    <PrivacyPrompt />,
  ];
});
