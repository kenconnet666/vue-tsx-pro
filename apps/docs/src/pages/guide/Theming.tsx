/** 指南：主题定制。左边是主题编辑器，右边是一块样板间，调整立即作用在整个站点上 */
import { Bell, Plus, Settings } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Code,
  Field,
  Flex,
  H2,
  H3,
  IconButton,
  Paragraph,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TextField,
  ThemeCustomizer,
} from '@vue-tsx-pro/ui';
import CustomBrand from '../demo/CustomBrand.tsx?demo';
import FollowSystem from '../demo/FollowSystem.tsx?demo';
import RuntimeSwitch from '../demo/RuntimeSwitch.tsx?demo';
import ThemeGallery from '../demo/ThemeGallery.tsx?demo';
import { DocPage } from '../../site/DocPage';
import { Example } from '../../site/Example';
import { preference, themeSettings } from '../../site/theme';

const meta = {
  title: '主题定制',
  description:
    '五套内置主题，局部主题、跟随系统、运行时切换与自定义品牌色的用法；调品牌色、中性色、圆角、缩放、字体与动效，改动立即作用在整个站点上，满意后复制代码到自己的项目。',
};

const styles = stylex.create({
  // 宽屏时编辑器在左、样板间在右并粘在顶栏下面；窄屏上下排
  layout: {
    display: 'grid',
    gap: '2.5rem',
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 72rem)': 'minmax(20rem, 26rem) minmax(0, 1fr)',
    },
  },
  preview: {
    position: { default: 'static', '@media (min-width: 72rem)': 'sticky' },
    // 顶栏高度（AppShell 的 HEADER_HEIGHT）+ 间距
    top: 'calc(3rem + 1.5rem)',
    // 样板间是界面，不是长文：字号与行高回到组件的默认值
    fontSize: '_md',
    lineHeight: '_normal',
  },
});

const cities = [
  { value: 'sh', label: '上海' },
  { value: 'bj', label: '北京' },
  { value: 'sz', label: '深圳' },
];

/** 样板间：常用组件放在一起，看整体效果 */
const Showcase = _component(() => {
  let city = _state('sh');
  let notify = _state(true);
  let agreed = _state(false);
  let plan = _state('pro');
  let volume = _state(60);
  let tab = _state('overview');
  return () => (
    <Card variant="surface">
      <Flex direction="column" gap="lg">
        <Flex align="center" gap="sm" justify="between">
          <H3 size="lg">项目设置</H3>
          <Flex gap="xs">
            <IconButton icon={Bell} aria-label="通知" />
            <IconButton icon={Settings} aria-label="设置" />
          </Flex>
        </Flex>
        <Tabs value={_bind(tab)}>
          <TabList aria-label="设置分区">
            <Tab value="overview">概览</Tab>
            <Tab value="members">成员</Tab>
            <Tab value="billing">账单</Tab>
          </TabList>
          <TabPanel value="overview">
            <Flex direction="column" gap="md">
              <Paragraph tone="muted">
                主题定制只改 token：组件的结构与行为不变，换色、圆角、字号、动效都随之统一变化。
              </Paragraph>
              <Flex gap="xs" wrap>
                <Badge tone="accent">新版本</Badge>
                <Badge tone="success">运行中</Badge>
                <Badge tone="warning">待审核</Badge>
                <Tag>TypeScript</Tag>
                <Tag>Vue</Tag>
              </Flex>
              <Progress value={68} aria-label="存储用量" />
            </Flex>
          </TabPanel>
          <TabPanel value="members">
            <Paragraph tone="muted">三位成员，一位待接受邀请。</Paragraph>
          </TabPanel>
          <TabPanel value="billing">
            <Paragraph tone="muted">下次扣费在 11 月 1 日。</Paragraph>
          </TabPanel>
        </Tabs>
        <Field label="项目名称" description="团队成员都能看到">
          <TextField value="vue-tsx-pro" />
        </Field>
        <Field label="所在城市">
          <Select items={cities} value={_bind(city)} />
        </Field>
        <Field label="套餐">
          <RadioGroup value={_bind(plan)}>
            <Radio value="free">免费</Radio>
            <Radio value="pro">专业</Radio>
          </RadioGroup>
        </Field>
        <Slider value={_bind(volume)} aria-label="提醒音量" />
        <Flex direction="column" gap="sm">
          <Switch checked={_bind(notify)}>部署完成时通知我</Switch>
          <Checkbox checked={_bind(agreed)}>我已阅读并同意服务条款</Checkbox>
        </Flex>
        <Alert tone="info" title="提示">
          改动保存在这个浏览器里，刷新后仍然生效。
        </Alert>
        <Flex gap="sm" wrap>
          <Button icon={Plus}>新建项目</Button>
          <Button variant="soft">邀请成员</Button>
          <Button variant="outline" tone="neutral">
            取消
          </Button>
          <Button variant="soft" tone="danger">
            删除
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
});

export default _component(() => () => (
  <DocPage wide meta={meta}>
    <div {...stylex.attrs(styles.layout)}>
      <Flex direction="column" gap="md">
        <H2 id="customize" size="xl" anchor>
          调整
        </H2>
        <ThemeCustomizer
          settings={themeSettings.value}
          {...{
            'onUpdate:settings': (next: typeof themeSettings.value) => (themeSettings.value = next),
          }}
          base={preference.theme}
        />
      </Flex>
      <div {...stylex.attrs(styles.preview)}>
        <Showcase />
      </div>
    </div>
    <Example id="builtin" title="内置主题" demo={ThemeGallery}>
      亮色（<Code>lightTheme</Code>，默认）、暗色（<Code>darkTheme</Code>）、纸张（
      <Code>paperTheme</Code>，米黄纸色与衬线标题）、 午夜（<Code>midnightTheme</Code>
      ，深海军蓝与青色）、高对比（<Code>highContrastTheme</Code>，纯白纯黑、文字到
      7:1）。每套都通过对比度检查。示例里每张卡片套一层 <Code>Provider</Code>
      ：主题只作用在这一块，这就是局部主题的写法。
    </Example>
    <Example id="follow-system" title="跟随系统" demo={FollowSystem}>
      <Code>theme</Code> 写成 <Code>{'{ light, dark }'}</Code> 两套，按系统的明暗选一套；
      <Code>createUi</Code> 与 <Code>Provider</Code> 都接受这种写法。
    </Example>
    <Example id="switch" title="运行时切换" demo={RuntimeSwitch}>
      <Code>createThemePreference</Code> 记住用户的选择（某一套主题或跟随系统），
      <Code>ThemeSwitcher</Code> 列出选项，切换时从按钮处圆形展开。页面首次加载不闪默认主题：把{' '}
      <Code>themeBootScript</Code> 生成的脚本内联到 HTML 的 head 里。
    </Example>
    <Example id="brand" title="自定义品牌色与圆角" demo={CustomBrand}>
      <Code>defineTheme</Code> 在已有主题上改 token，<Code>paletteColors</Code> 按 Radix
      色阶整组换品牌色与中性色；
      <Code>customizeTheme</Code>{' '}
      是上面主题编辑器的旋钮，品牌色、中性色、圆角、缩放、字体、动效一次给出。
    </Example>
  </DocPage>
));
