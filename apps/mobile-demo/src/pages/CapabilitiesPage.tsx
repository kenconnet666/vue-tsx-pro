// 授权类能力：设备权限、存储、登录、手机号与头像（开放能力按钮）、支付、订阅消息、隐私协议。
// 测试号与 H5 拿不到真的支付、手机号：这些按钮演示调用与失败分支，结果用轻提示给出
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  Cell,
  CellGroup,
  ConfigProvider,
  Field,
  Image,
  Space,
  showToast,
  useHost,
  usePermission,
  useStorage,
  type DevicePermission,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { demoSettings } from '../settings.ts';

const styles = css.create({
  page: { minHeight: '100vh', paddingBlockEnd: '_xxl', backgroundColor: '_background' },
  section: { paddingInline: '_lg', paddingBlock: '_md' },
  hint: { paddingInline: '_lg', paddingBlock: '_sm', fontSize: '_sm', color: '_textMuted' },
  avatar: { width: '3em', height: '3em', borderRadius: '_full', overflow: 'hidden' },
});

const PERMISSIONS: [DevicePermission, string][] = [
  ['location', '位置'],
  ['camera', '相机'],
  ['microphone', '麦克风'],
  ['album', '保存到相册'],
  ['bluetooth', '蓝牙'],
];

const STATUS_TEXT = {
  granted: '已同意',
  denied: '已拒绝',
  prompt: '未询问',
  unsupported: '不支持',
} as const;

/** 失败时给出原因（测试号、H5 上很多能力会走到这里） */
const failed = (error: unknown) =>
  showToast(error instanceof Error ? error.message : JSON.stringify(error));

/** 一行设备权限：状态在右边，点一下申请 */
const PermissionCell = _component(({ name, title }: { name: DevicePermission; title: string }) => {
  const permission = usePermission(_untrack(name));
  return () => (
    <Cell
      title={title}
      value={permission.status.value ? STATUS_TEXT[permission.status.value] : '…'}
      arrow
      onClick={() =>
        void permission
          .request()
          .then(
            (usable) =>
              usable &&
              permission.status.value === 'prompt' &&
              showToast(`${title}：用到时由平台询问`),
          )
      }
    />
  );
});

export const CapabilitiesPage = _component(() => {
  const host = useHost();
  const visits = useStorage('demo-visits', 0);
  visits.value++;
  let avatar = _state('');
  let nickname = _state('');
  // 手机号：微信是 getPhoneNumber 按钮，支付宝是授权范围为手机号的 getAuthorize 按钮
  const phoneOpenType = host.platform === 'my' ? 'getAuthorize' : 'getPhoneNumber';

  return () => (
    <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
      <CellGroup title="设备权限（点一下申请；拒绝过的引导去设置页）">
        {PERMISSIONS.map(([name, title]) => (
          <PermissionCell name={name} title={title} />
        ))}
      </CellGroup>

      <CellGroup title="存储">
        <Cell title="打开这一页的次数" value={String(visits.value)} />
        <div {...css.attrs(styles.hint)}>存在本地：关掉再打开，次数接着加</div>
      </CellGroup>

      <CellGroup title="登录与资料">
        <div {...css.attrs(styles.section)}>
          <Space wrap>
            <Button
              onClick={() =>
                void host
                  .login()
                  .then(({ code }) => showToast(`拿到凭证：${code.slice(0, 8)}…`), failed)
              }
            >
              登录
            </Button>
            <Button
              variant="soft"
              openType={phoneOpenType}
              authScope="phoneNumber"
              onOpenType={(detail) =>
                void host.phoneNumber(detail).then(() => showToast('手机号凭证已拿到'), failed)
              }
              onClick={() =>
                host.platform === 'web' && showToast('H5 没有手机号授权，用短信验证码')
              }
            >
              手机号登录
            </Button>
          </Space>
        </div>
        <Cell title="头像" center>
          <Button
            variant="ghost"
            openType="chooseAvatar"
            onOpenType={(detail) => (avatar = (detail as { avatarUrl?: string }).avatarUrl ?? '')}
          >
            {avatar ? <Image src={avatar} sx={styles.avatar} /> : '选择头像'}
          </Button>
        </Cell>
        <Field
          label="昵称"
          type="nickname"
          _value={nickname}
          placeholder="微信里键盘上方给出微信昵称"
        />
      </CellGroup>

      <CellGroup title="支付与消息">
        <div {...css.attrs(styles.section)}>
          <Space wrap>
            <Button
              tone="success"
              onClick={() =>
                void host
                  .pay(
                    host.platform === 'my'
                      ? { provider: 'alipay', tradeNO: 'demo-trade-no' }
                      : {
                          provider: 'wechat',
                          timeStamp: String(Math.floor(Date.now() / 1000)),
                          nonceStr: 'demo',
                          package: 'prepay_id=demo',
                          signType: 'RSA',
                          paySign: 'demo',
                        },
                  )
                  .then(({ status }) => showToast(`支付结果：${status}`), failed)
              }
            >
              模拟支付
            </Button>
            <Button
              variant="soft"
              onClick={() =>
                void host
                  .subscribe(['demo-template'])
                  .then((result) => showToast(`订阅：${result['demo-template']}`), failed)
              }
            >
              订阅消息
            </Button>
            <Button variant="ghost" onClick={() => void host.openPrivacyContract().catch(failed)}>
              隐私协议
            </Button>
          </Space>
        </div>
        <div {...css.attrs(styles.hint)}>
          支付参数是假的：微信、支付宝会返回失败；真的下单要后端签名、正式 AppID 与商户号
        </div>
      </CellGroup>
    </ConfigProvider>
  );
});
