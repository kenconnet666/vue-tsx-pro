/**
 * 隐私协议弹窗：微信要求用户先同意隐私保护指引，才放行位置、相册、剪贴板这类隐私接口。平台拦下接口时
 * （宿主的 onPrivacyRequest）从底部弹出，同意按钮是 open-type="agreePrivacyAuthorization" 的原生按钮。
 * ConfigProvider 自动渲染一个（在命令式反馈的出口里）；H5 与支付宝不会触发。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount } from 'vue';
import { Button } from '../base/Button';
import { useConfig } from '../config/context';
import { Popup } from '../overlay/Popup';
import { useHost } from '../utils/host';
import type { PrivacyReply } from './types';

/** 同意按钮的 id：微信回复同意时要带上它，确认是用户点了这个按钮 */
const AGREE_ID = 'vtm-privacy-agree';

const styles = css.create({
  body: { display: 'flex', flexDirection: 'column', gap: '_md', padding: '_lg' },
  title: { fontSize: '_lg', fontWeight: '_semibold', textAlign: 'center' },
  message: { fontSize: '_sm', lineHeight: '_relaxed', color: '_textMuted' },
  link: { color: '_accentText' },
  actions: { display: 'flex', gap: '_md' },
  action: { flex: '1 1 0' },
});

export const PrivacyPrompt = _component(() => {
  const host = useHost();
  const config = useConfig();
  let reply = _state<PrivacyReply | null>(null);
  onBeforeUnmount(host.onPrivacyRequest((next) => (reply = next)));

  const answer = (agreed: boolean) => {
    reply?.(agreed, agreed ? AGREE_ID : undefined);
    reply = null;
  };

  return () => {
    const text = config.lang.privacy;
    return (
      <Popup
        _open={reply !== null}
        position="bottom"
        round
        closeOnOverlay={false}
        onOpenChange={(open) => !open && answer(false)}
      >
        <div {...css.attrs(styles.body)}>
          <div {...css.attrs(styles.title)}>{text.title}</div>
          <div {...css.attrs(styles.message)}>
            {text.message}
            <span {...css.attrs(styles.link)} onClick={() => void host.openPrivacyContract()}>
              {text.contract}
            </span>
          </div>
          <div {...css.attrs(styles.actions)}>
            <Button variant="soft" tone="neutral" sx={styles.action} onClick={() => answer(false)}>
              {text.disagree}
            </Button>
            <Button
              id={AGREE_ID}
              openType="agreePrivacyAuthorization"
              sx={styles.action}
              onOpenType={() => answer(true)}
            >
              {text.agree}
            </Button>
          </div>
        </div>
      </Popup>
    );
  };
});
