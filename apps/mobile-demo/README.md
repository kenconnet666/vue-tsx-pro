# mobile-demo

移动端组件库（`@zerodep-dev/vue-tsx-pro-mobile`）的演示：同一套页面跑在 H5、微信小程序、支付宝小程序，以及 Capacitor 打成的
iOS / Android 应用里。页面在 `src/pages`，入口：H5 与原生应用是 `src/main.ts`，小程序是 `src/app.ts`。

## 命令

| 命令                | 做什么                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`          | H5 开发服务器                                                              |
| `pnpm build`        | 出微信、支付宝两端工程（`dist/wx`、`dist/my`），配置在 `mini.config.ts`    |
| `pnpm dev:mini`     | 微信端的监听模式                                                           |
| `pnpm build:h5`     | H5 构建到 `dist/h5`（原生应用的外壳从这里取）                              |
| `pnpm cap:sync`     | H5 构建后同步进 `android/`、`ios/`；之后用 Android Studio / Xcode 打开运行 |
| `pnpm test:browser` | 真实浏览器里的测试（Chromium、WebKit，手机视口、触摸屏）                   |
| `pnpm screenshots`  | 各页截图：`node screenshots.ts [h5\|wx] [--dark] [--out 目录]`             |

组件库按 dist 引用：改了 `packages/mobile` 先 `pnpm --filter @zerodep-dev/vue-tsx-pro-mobile build`。

## 原生应用

`android/`、`ios/` 是 `cap add` 生成的工程（iOS 用 Swift Package Manager），权限与用途说明写在
`android/app/src/main/AndroidManifest.xml` 与 `ios/App/App/Info.plist`。外壳里由 `main.ts` 换成插件版的宿主能力
（`@zerodep-dev/vue-tsx-pro-mobile/capacitor`），并在顶上加带返回的导航栏。

构建在 CI 里做（`.github/workflows/app.yml`，iOS 要 macOS，安卓要 Android SDK）：

- 每次：安卓调试 APK（在模拟器里打开截图）与发布用的 AAB；iOS 模拟器包（在模拟器里打开截图）与设备包的归档。
- 推 `app-v1.2.0` 这样的标签：版本号取标签（versionName / MARKETING_VERSION），构建序号是运行序号。

## 发布要放的 secrets

仓库 Settings → Secrets and variables → Actions 里加上，CI 就会签名并把包作为构建产物上传（`android-release-aab`、`ios-ipa`）；
没有时安卓用临时密钥只验证能签名、iOS 只做不签名的归档。

| secret                            | 内容                                                                        |
| --------------------------------- | --------------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`         | 上传密钥库文件的 base64（`base64 -w0 release.keystore`）                    |
| `ANDROID_KEYSTORE_PASSWORD`       | 密钥库口令                                                                  |
| `ANDROID_KEY_ALIAS`               | 密钥别名                                                                    |
| `ANDROID_KEY_PASSWORD`            | 密钥口令                                                                    |
| `IOS_DIST_CERT_P12_BASE64`        | Apple Distribution 证书（含私钥）导出的 .p12 的 base64                      |
| `IOS_DIST_CERT_PASSWORD`          | 导出 .p12 时设的口令                                                        |
| `IOS_PROVISIONING_PROFILE_BASE64` | App Store 分发的描述文件（bundle id `dev.zerodep.vuetsxpro.demo`）的 base64 |
| `IOS_TEAM_ID`                     | 开发者团队 ID                                                               |

上传到 Google Play、App Store Connect（TestFlight）还没自动化：需要 Play 的服务账号、App Store Connect 的 API 密钥，有了再加。
App 里的微信、支付宝支付与登录用各自的 App SDK（开放平台的移动应用），和小程序是两套接入。
