/**
 * 移动端：授权类能力（设备权限、存储、开放能力按钮、隐私协议、登录、支付、订阅消息）。三端差异与后台要开通的项目
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Code,
  CodeBlock,
  H2,
  List,
  ListItem,
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../site/DocPage';
import { PhoneStage } from './Section';

const meta = {
  title: 'Capabilities 能力与权限',
  description:
    '位置、相机等设备权限，本地存储，登录与手机号，支付，订阅消息，微信的隐私协议：页面只写一套，H5、微信、支付宝各自的接口由宿主处理。',
};

const permissionCode = `const location = usePermission('location');
// location.status.value：granted 已同意、denied 拒绝过、prompt 还没问、unsupported 这一端没有
if (await location.request()) {
  // 已同意；拒绝过的会先弹对话框引导去设置页（H5 只说明）
}

const history = useStorage<string[]>('search-history', []);   // 改了自动写回`;

const accountCode = `const host = useHost();
const { code } = await host.login();            // 微信 code / 支付宝 authCode，交给后端换会话

<Button openType="getPhoneNumber" authScope="phoneNumber"   // 支付宝写 openType="getAuthorize"
  onOpenType={async (detail) => api.bindPhone(await host.phoneNumber(detail))}>
  手机号登录
</Button>

<Button openType="chooseAvatar" onOpenType={(detail) => (avatar = detail.avatarUrl)}>头像</Button>
<Field label="昵称" type="nickname" _value={nickname} />`;

const payCode = `const order = await api.createOrder(cart);      // 后端下单、签名，返回下面任一种
const { status } = await useHost().pay(order);
// order：{ provider: 'wechat', timeStamp, nonceStr, package, signType, paySign, appId? }
//      | { provider: 'alipay', tradeNO }
//      | { provider: 'redirect', url }              // H5 在微信、支付宝之外的浏览器里跳支付页
if (status === 'success' || status === 'pending') await api.confirmOrder(order);   // 都以后端查单为准`;

const h5Code = `// H5 没有平台登录：由应用给出实现，组件与页面照常调 useHost().login()
<ConfigProvider host={{ login: () => myOAuthLogin() }}>…</ConfigProvider>`;

const configCode = `// mini.config.ts
export default defineMiniConfig({
  plugins: vueTsxPro(),
  appId: 'wx…',
  permissions: { location: '用于展示附近门店' },   // 微信授权弹窗里的用途说明，写进 app.json 的 permission
  requiredPrivateInfos: ['getLocation'],           // 用到的地理位置接口；模糊与精确位置的接口互斥，同时写构建报错
});`;

const PERMISSIONS: [string, string, string, string][] = [
  [
    'location / fuzzyLocation',
    'scope.userLocation / scope.userFuzzyLocation',
    'location',
    'geolocation',
  ],
  ['camera', 'scope.camera', 'camera', 'getUserMedia（视频）'],
  ['microphone', 'scope.record', '用到时由系统询问', 'getUserMedia（音频）'],
  ['album', 'scope.writePhotosAlbum', 'album', '下载文件，不用授权'],
  ['bluetooth', 'scope.bluetooth', '用到时由系统询问', 'Web Bluetooth（iOS 没有）'],
];

const PAYMENTS: [string, string, string][] = [
  ['success', 'requestPayment 成功', 'resultCode 9000'],
  ['cancel', 'fail 且 errMsg 含 cancel', '6001'],
  ['pending', '—', '8000 处理中、6004 结果未知'],
  ['fail', '其余失败', '其余结果码'],
];

export default _component(() => () => (
  <DocPage
    meta={meta}
    imports="import { useHost, usePermission, useStorage } from '@zerodep-dev/vue-tsx-pro-mobile';"
    wide
  >
    <PhoneStage demo="capabilities" title={meta.title} />

    <H2 id="permissions" size="xl" anchor>
      设备权限与存储
    </H2>
    <CodeBlock code={permissionCode} lang="tsx" />
    <Table aria-label="设备权限在三端对应的授权">
      <TableHead>
        <TableRow>
          <TableHeaderCell>权限</TableHeaderCell>
          <TableHeaderCell>微信（scope）</TableHeaderCell>
          <TableHeaderCell>支付宝（authSetting）</TableHeaderCell>
          <TableHeaderCell>H5</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {PERMISSIONS.map((row) => (
          <TableRow>
            {row.map((cell) => (
              <TableCell>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <List>
      <ListItem>
        拒绝过的授权平台不会再弹窗，只能去设置页打开：<Code>usePermission</Code>{' '}
        弹对话框问要不要去。
      </ListItem>
      <ListItem>
        支付宝没有提前申请的接口，授权在第一次调用对应能力时弹出，申请时返回 prompt。
      </ListItem>
      <ListItem>存储三端都是同步接口，值按 JSON 存取；H5 的隐私模式下写不进去时静默忽略。</ListItem>
    </List>

    <H2 id="account" size="xl" anchor>
      登录、手机号、头像
    </H2>
    <CodeBlock code={accountCode} lang="tsx" />
    <Paragraph>
      手机号、头像、隐私协议的同意都只能由用户点原生按钮触发：Button 的 <Code>openType</Code>
      在小程序里换成原生 button（外观仍是组件的），结果从 <Code>onOpenType</Code> 拿到；H5
      里不起作用。
    </Paragraph>
    <CodeBlock title="H5 的登录" code={h5Code} lang="tsx" />

    <H2 id="privacy" size="xl" anchor>
      隐私协议（微信）
    </H2>
    <Paragraph>
      {
        '微信要求用户先同意隐私保护指引，才放行位置、相册、剪贴板这类接口。平台拦下接口时，ConfigProvider 里自动渲染的 '
      }
      <Code>PrivacyPrompt</Code>
      {
        '从底部弹出，用户点同意后被拦下的接口继续执行。小程序后台要先填好《用户隐私保护指引》，没声明的接口会直接被禁用。'
      }
    </Paragraph>

    <H2 id="payment" size="xl" anchor>
      支付
    </H2>
    <CodeBlock code={payCode} lang="ts" />
    <Table aria-label="支付结果的映射">
      <TableHead>
        <TableRow>
          <TableHeaderCell>结果</TableHeaderCell>
          <TableHeaderCell>微信</TableHeaderCell>
          <TableHeaderCell>支付宝</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {PAYMENTS.map((row) => (
          <TableRow>
            {row.map((cell) => (
              <TableCell>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Paragraph>
      组件库不碰密钥、不签名；前端看到的成功也要以后端查单为准。订阅消息用{' '}
      <Code>useHost().subscribe(templateIds)</Code>：一次最多 3 个模板，要在用户点按的回调里调用。
    </Paragraph>

    <H2 id="config" size="xl" anchor>
      构建声明与后台开通
    </H2>
    <CodeBlock code={configCode} lang="ts" />
    <List>
      <ListItem>微信支付、手机号、模糊定位要在小程序后台开通，测试号与个人主体拿不到。</ListItem>
      <ListItem>隐私保护指引要在后台声明用到的每类信息（位置、相册、蓝牙……）。</ListItem>
      <ListItem>支付宝的手机号、会员信息要在开放平台签约对应的能力。</ListItem>
    </List>
  </DocPage>
));
