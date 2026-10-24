/**
 * 主题定制页的预览：一个小型应用页面（导航、统计卡、图表、表单、表格、提示、对话框），
 * 看调整对整套界面的影响。可以只看当前主题，也可以把同样的设置套在亮色、暗色上并排对比。
 */
import { Bell, FolderKanban, Plus, Search, Settings, Users, Wallet } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  darkTheme,
  Field,
  Flex,
  Grid,
  H3,
  IconButton,
  lightTheme,
  Progress,
  Provider,
  Select,
  Stat,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabList,
  Tabs,
  Text,
  TextField,
  ToggleGroup,
  ToggleItem,
  type StatusTone,
} from '@vue-tsx-pro/ui';
import { BarChart } from '@vue-tsx-pro/ui/charts';
import { customizeTheme } from '@vue-tsx-pro/ui/theme-customize';
import { themeSettings } from '../../../site/theme';

const styles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_md' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '_sm' },
  // 一块“应用窗口”：自己画页面底色，套了局部主题时也是那套主题的底色
  frame: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_lg',
    minWidth: 0,
    padding: '_lg',
    borderRadius: '_lg',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    color: '_text',
    backgroundColor: '_background',
  },
  topbar: { display: 'flex', alignItems: 'center', gap: '_md', flexWrap: 'wrap' },
  brand: { fontWeight: '_bold', fontFamily: '_heading' },
  spacer: { flexGrow: 1 },
  // 一行里的卡片宽窄不一（small、wide 的基准宽度不同），按基准分摊整行、放不下就换行：等宽列的 Grid 做不到
  row: { display: 'flex', flexWrap: 'wrap', gap: '_md' },
  small: { flex: '1 1 10em', minWidth: 0 },
  wide: { flex: '1 1 16em', minWidth: 0 },
  // 对话框的样子：浮起的面板，用最高一档阴影
  dialog: { flex: '1 1 16em', alignSelf: 'flex-start', minWidth: 0, boxShadow: '_xl' },
});

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月'].map((month, index) => ({
  month,
  income: [42, 58, 51, 66, 73, 88][index]!,
  cost: [30, 36, 40, 38, 45, 49][index]!,
}));

const PROJECTS: [name: string, owner: string, progress: number, status: [string, StatusTone]][] = [
  ['官网改版', '张三', 100, ['已上线', 'success']],
  ['支付接入', '李四', 72, ['进行中', 'info']],
  ['数据看板', '王五', 45, ['待评审', 'warning']],
  ['旧版下线', '赵六', 10, ['已阻塞', 'danger']],
];

const cities = [
  { value: 'sh', label: '上海' },
  { value: 'bj', label: '北京' },
  { value: 'sz', label: '深圳' },
];

/** 小型应用页：每个实例自己的表单状态 */
const MiniApp = _component(({ title }: { title?: string }) => {
  let tab = _state('overview');
  let city = _state('sh');
  let notify = _state(true);
  let agreed = _state(false);
  return () => (
    <div {...css.attrs(styles.frame)}>
      <div {...css.attrs(styles.topbar)}>
        <span {...css.attrs(styles.brand)}>{title ?? '控制台'}</span>
        <Tabs value={_bind(tab)}>
          <TabList aria-label={`${title ?? '控制台'}的分区`}>
            <Tab value="overview">概览</Tab>
            <Tab value="projects">项目</Tab>
            <Tab value="members">成员</Tab>
          </TabList>
        </Tabs>
        <span {...css.attrs(styles.spacer)} />
        <IconButton icon={Search} aria-label="搜索" />
        <IconButton icon={Bell} aria-label="通知" />
        <Avatar name="Ada Lovelace" size="sm" />
      </div>

      <div {...css.attrs(styles.row)}>
        <Card sx={styles.small}>
          <Stat label="本月收入" value={88} unit="万元" change={0.205} icon={Wallet} />
        </Card>
        <Card sx={styles.small}>
          <Stat label="活跃项目" value={12} unit="个" change={-0.08} icon={FolderKanban} />
        </Card>
        <Card sx={styles.small}>
          <Stat label="团队成员" value={36} unit="人" change={0.03} icon={Users} />
        </Card>
      </div>

      <div {...css.attrs(styles.row)}>
        <Card sx={styles.wide} header={<H3 size="md">收支趋势</H3>}>
          <BarChart
            aria-label="近六个月收支"
            data={MONTHS}
            index="month"
            series={[
              { key: 'income', label: '收入' },
              { key: 'cost', label: '支出' },
            ]}
            unit="万元"
          />
        </Card>
        <Card
          sx={styles.wide}
          header={<H3 size="md">项目设置</H3>}
          footer={
            <Flex gap="sm" justify="end" wrap>
              <Button variant="outline" tone="neutral">
                取消
              </Button>
              <Button icon={Plus}>保存</Button>
            </Flex>
          }
        >
          <Flex direction="column" gap="md">
            <Field label="项目名称" description="团队成员都能看到">
              <TextField value="vue-tsx-pro" />
            </Field>
            <Field label="所在城市">
              <Select items={cities} value={_bind(city)} />
            </Field>
            <Switch checked={_bind(notify)}>部署完成时通知我</Switch>
            <Checkbox checked={_bind(agreed)}>我已阅读并同意服务条款</Checkbox>
          </Flex>
        </Card>
      </div>

      <Card header={<H3 size="md">项目进度</H3>}>
        <Table aria-label="项目进度">
          <TableHead>
            <TableRow>
              <TableHeaderCell>项目</TableHeaderCell>
              <TableHeaderCell>负责人</TableHeaderCell>
              <TableHeaderCell>进度</TableHeaderCell>
              <TableHeaderCell>状态</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PROJECTS.map(([name, owner, progress, [label, tone]]) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell>{owner}</TableCell>
                <TableCell>
                  <Progress value={progress} tone={tone} aria-label={`${name}的进度`} />
                </TableCell>
                <TableCell>
                  <Badge tone={tone}>{label}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div {...css.attrs(styles.row)}>
        <Flex direction="column" gap="sm" sx={styles.wide}>
          <Alert tone="info" title="新版本">
            支持按项目设置通知方式。
          </Alert>
          <Alert tone="success" variant="surface" title="已保存" />
          <Alert tone="warning" title="即将到期">
            订阅还有 3 天到期。
          </Alert>
          <Alert tone="danger" variant="outline" title="部署失败">
            网络连接中断，请重试。
          </Alert>
        </Flex>
        <Card sx={styles.dialog} header={<H3 size="md">删除这个项目？</H3>}>
          <Flex direction="column" gap="md">
            <Text tone="muted">删除后项目里的数据无法恢复，成员也会失去访问权限。</Text>
            <Flex gap="sm" justify="end">
              <Button variant="soft" tone="neutral" icon={Settings}>
                先归档
              </Button>
              <Button tone="danger">删除</Button>
            </Flex>
          </Flex>
        </Card>
      </div>
    </div>
  );
});

/** 预览：当前主题，或同一组设置下的亮色与暗色并排 */
export const Preview = _component(() => {
  let mode = _state<'current' | 'compare'>('current');
  return () => (
    <div {...css.attrs(styles.root)}>
      <div {...css.attrs(styles.toolbar)}>
        <Text weight="semibold">预览</Text>
        <ToggleGroup value={_bind(mode)} required size="sm" aria-label="预览方式">
          <ToggleItem value="current">当前主题</ToggleItem>
          <ToggleItem value="compare">亮暗对比</ToggleItem>
        </ToggleGroup>
      </div>
      {mode === 'current' ? (
        <MiniApp />
      ) : (
        <Grid minItemWidth="24rem" gap="md">
          <Provider theme={customizeTheme(lightTheme, themeSettings.value)}>
            <MiniApp title="亮色" />
          </Provider>
          <Provider theme={customizeTheme(darkTheme, themeSettings.value)}>
            <MiniApp title="暗色" />
          </Provider>
        </Grid>
      )}
    </div>
  );
});
