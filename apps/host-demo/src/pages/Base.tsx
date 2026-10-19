// 基础组件演示（文档站暂缓，先在这里按分类演示）：每加一批组件就加一节
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bold,
  ChevronDown,
  Copy,
  Pencil,
  Download,
  House,
  LayoutGrid,
  List,
  Underline,
  FlaskConical,
  UserRound,
  Italic,
  Plus,
  Settings,
  Star,
  Trash2,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Button,
  Alert,
  Checkbox,
  CheckboxGroup,
  Combobox,
  Empty,
  Listbox,
  Select,
  type ListboxOption,
  Field,
  NumberField,
  Radio,
  RadioGroup,
  Switch,
  Textarea,
  TextField,
  AlertDialog,
  Dialog,
  Drawer,
  Avatar,
  Badge,
  Card,
  Breadcrumbs,
  Code,
  CodeBlock,
  Collapsible,
  Container,
  darkTheme,
  Flex,
  GridList,
  H2,
  H3,
  H4,
  ClearButton,
  CloseButton,
  CopyButton,
  Icon,
  IconButton,
  Kbd,
  lightTheme,
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  Popover,
  Tooltip,
  Link,
  LinkButton,
  LoadingOverlay,
  Paragraph,
  Progress,
  Skeleton,
  NavGroup,
  NavItem,
  NavList,
  Pagination,
  Steps,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  Provider,
  ScrollArea,
  Separator,
  Slider,
  SlideVerify,
  type SlideVerifyResult,
  Small,
  Strong,
  Text,
  ToggleGroup,
  ToggleItem,
  Toolbar,
  Toaster,
  useConfirm,
  useLayoutAnimation,
  VirtualList,
  VisuallyHidden,
  type VirtualListHandle,
} from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';
import { toaster } from '../toaster';
import { FormDemo } from './FormDemo';
import { MotionDemo } from './MotionDemo';
import { TableDemo } from './TableDemo';

const sampleCode = `export const Counter = _component(() => {
  let count = _state(0); // 像普通变量一样读写
  return () => <button onClick={() => count++}>{count}</button>;
});`;

/** 虚拟列表的演示数据：一万行，每七行有一行是两行文字（行高不固定） */
const rows = Array.from({ length: 10000 }, (_, index) => ({
  id: index,
  text:
    index % 7 === 3
      ? `第 ${index + 1} 行：这一行的说明比较长，会换成两行显示，用来演示行高不固定时的自动测量`
      : `第 ${index + 1} 行`,
}));

const styles = stylex.create({
  page: {
    display: 'grid',
    alignContent: 'start',
    gap: '_xl',
    padding: '_xl',
    minHeight: '100vh',
    backgroundColor: '_background',
  },
  section: { display: 'grid', gap: '_md' },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '_md' },
  iconButton: {
    display: 'inline-flex',
    padding: '_sm',
    borderWidth: 0,
    backgroundColor: '_fill',
    color: '_text',
  },
  paragraph: { margin: 0, paddingBlock: '_sm' },
  narrow: { maxWidth: '20em' },
  card: { padding: '_md', borderRadius: '_md', backgroundColor: '_fill', color: '_text' },
  virtualList: {
    height: '16em',
    maxWidth: '24em',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
  },
  virtualRow: { paddingBlock: '_xs', paddingInline: '_md' },
  scrollBox: {
    height: '10em',
    maxWidth: '24em',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
  },
  scrollLine: { margin: 0, paddingBlock: '_xs', paddingInline: '_md' },
  wide: { width: '40em', margin: 0, padding: '_md' },
  verify: { maxWidth: '20em' },
  puzzle: {
    position: 'relative',
    height: '6em',
    maxWidth: '20em',
    borderRadius: '_md',
    backgroundImage: 'linear-gradient(135deg, _colors.accentSoft, _colors.infoSoft)',
    overflow: 'hidden',
  },
  // 拼图块与缺口都是 3em 见方；left 由位置（0–1）乘以可移动距离算出
  piece: {
    position: 'absolute',
    top: '1.5em',
    width: '3em',
    height: '3em',
    borderRadius: '_sm',
  },
  gap: { backgroundColor: 'color-mix(in srgb, _text 25%, transparent)' },
  block: { backgroundColor: '_accent', boxShadow: '_md' },
  slider: { maxWidth: '16em' },
  outlined: { borderWidth: '_xs', borderStyle: 'dashed', borderColor: '_border' },
});

// 拼图块的位置是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
const pieceStyles = stylex.create({
  left: (position: number) => ({ left: `calc(${position} * (100% - 3em))` }),
});

const Section = _component(
  ({ title, children }: { title: string; children?: VNodeChild }) =>
    () => (
      <section {...stylex.attrs(styles.section)}>
        <H2 size="lg">{title}</H2>
        {children}
      </section>
    ),
);

/** 下拉、组合框的演示选项 */
const cityOptions: ListboxOption[] = [
  { value: 'bj', label: '北京', group: '华北' },
  { value: 'tj', label: '天津', group: '华北' },
  { value: 'sh', label: '上海', group: '华东' },
  { value: 'hz', label: '杭州', group: '华东', description: '浙江省会' },
  { value: 'nj', label: '南京', group: '华东', disabled: true },
  { value: 'gz', label: '广州', group: '华南' },
  { value: 'sz', label: '深圳', group: '华南' },
];
const languageOptions: ListboxOption[] = [
  'TypeScript',
  'JavaScript',
  'Rust',
  'Go',
  'Python',
  'Kotlin',
].map((label) => ({ value: label.toLowerCase(), label }));
/** 一万个选项：下拉列表是虚拟滚动的 */
const manyOptions: ListboxOption[] = Array.from({ length: 10_000 }, (_, index) => ({
  value: String(index + 1),
  label: `编号 ${index + 1}`,
}));
const fruitOptions: ListboxOption[] = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
];

/** /base 演示页：按分类演示组件库的基础组件，浏览器测试与 axe 检查也跑在这一页上 */
export const Base = _component(() => {
  let dark = _state(false);
  let listHandle: VirtualListHandle | undefined;
  let volume = _state(40);
  let priceRange = _state<[number, number]>([200, 600]);
  let saving = _state(false);
  let cities = _state(['上海', '北京', '深圳', '广州', '杭州']);
  // 标签离场后，其余的平移补位
  let tagList = _state.raw<unknown>(null);
  const tagLayout = useLayoutAnimation(() => tagList);
  let loadingProfile = _state(true);
  let refreshing = _state(false);
  let stackToasts = _state(false);
  function refresh() {
    refreshing = true;
    setTimeout(() => (refreshing = false), 1500);
  }
  let showAlert = _state(true);
  let dialogOpen = _state(false);
  let drawerOpen = _state(false);
  let confirmOpen = _state(false);
  let deleted = _state(0);
  let cartResult = _state('');
  const confirm = useConfirm();
  async function clearCart() {
    const ok = await confirm({
      title: '清空购物车？',
      description: '购物车里的 3 件商品会被移除。',
      tone: 'danger',
      confirmText: '清空',
    });
    cartResult = ok ? '已清空' : '已取消';
  }
  let email = _state('');
  let password = _state('');
  let quantity = _state<number | null>(1);
  let note = _state('');
  let homepage = _state('my-site');
  let autoSave = _state(true);
  let savingSwitch = _state(false);
  function toggleAutoSave() {
    savingSwitch = true;
    setTimeout(() => {
      autoSave = !autoSave;
      savingSwitch = false;
    }, 1000);
  }
  let agreed = _state(false);
  let channels = _state<string[]>(['email']);
  let shipping = _state<string | undefined>('express');
  let notify = _state(true);
  let city = _state<string | undefined>(undefined);
  let pickedCities = _state<string[]>(['sh']);
  let language = _state<string | undefined>(undefined);
  let fruit = _state<string | undefined>('banana');
  let serial = _state<string | undefined>(undefined);
  let menuAction = _state('');
  let showGrid = _state(true);
  let sortBy = _state('name');

  function notifyUndo() {
    const id = toaster.show({
      title: '已移到回收站',
      description: '30 天后自动删除。',
      action: (
        <Button size="sm" variant="soft" class="toast-undo" onClick={() => toaster.dismiss(id)}>
          撤销
        </Button>
      ),
    });
  }
  function upload() {
    void toaster
      .promise(new Promise((resolve) => setTimeout(resolve, 800)), {
        loading: { title: '正在上传' },
        success: { title: '上传完成' },
        error: { title: '上传失败' },
      })
      .catch(() => {});
  }
  let orderTab = _state('all');
  let step = _state(1);
  let page = _state(3);
  let view = _state<string | undefined>('list');
  let marks = _state<string[]>(['bold']);

  function save() {
    saving = true;
    setTimeout(() => (saving = false), 1500);
  }
  let verifyStatus = _state<'idle' | 'verifying' | 'success' | 'error'>('idle');
  let puzzleStatus = _state<'idle' | 'verifying' | 'success' | 'error'>('idle');
  let puzzlePosition = _state(0);
  // 演示用：缺口位置与判定本应由服务端生成和完成，这里在前端模拟
  let puzzleTarget = _state(0.6);

  /** 模拟服务端校验：真实场景把 result（位置与轨迹）发给服务端 */
  function verifySlide(result: SlideVerifyResult) {
    verifyStatus = 'verifying';
    setTimeout(() => (verifyStatus = result.position >= 0.98 ? 'success' : 'error'), 400);
  }
  function verifyPuzzle(result: SlideVerifyResult) {
    puzzleStatus = 'verifying';
    setTimeout(() => {
      puzzleStatus = Math.abs(result.position - puzzleTarget) < 0.04 ? 'success' : 'error';
    }, 400);
  }
  function resetPuzzle() {
    puzzleTarget = 0.3 + Math.random() * 0.6;
    puzzleStatus = 'idle';
  }

  return () => (
    <Provider theme={dark ? darkTheme : lightTheme}>
      <main {...stylex.attrs(styles.page)}>
        <div {...stylex.attrs(styles.row)}>
          <Button variant="outline" class="toggle-theme" onClick={() => (dark = !dark)}>
            {dark ? '亮色' : '暗色'}
          </Button>
        </div>

        <Section title="按钮 Button · LinkButton · IconButton · CopyButton">
          {(['accent', 'neutral', 'danger'] as const).map((tone) => (
            <Flex key={tone} gap="sm" wrap align="center" class={`button-row-${tone}`}>
              {(['solid', 'soft', 'surface', 'outline', 'ghost', 'link'] as const).map(
                (variant) => (
                  <Button key={variant} variant={variant} tone={tone}>
                    {variant}
                  </Button>
                ),
              )}
            </Flex>
          ))}
          <Flex gap="sm" wrap align="center">
            <Button size="xs" icon={Plus}>
              xs
            </Button>
            <Button size="sm" icon={Plus}>
              sm
            </Button>
            <Button icon={Plus}>继承</Button>
            <Button size="lg" icon={Plus}>
              lg
            </Button>
            <Button radius="full" variant="soft">
              胶囊
            </Button>
            <Button radius="none" variant="outline">
              直角
            </Button>
          </Flex>
          <Flex gap="sm" wrap align="center">
            <Button class="save-button" loading={saving} onClick={save} icon={Download}>
              保存
            </Button>
            <Button disabled>不可用</Button>
            <Button disabled focusableWhenDisabled tone="neutral" variant="outline">
              可聚焦的不可用
            </Button>
            <LinkButton href="#buttons" variant="soft" iconEnd={ArrowRight}>
              链接按钮
            </LinkButton>
            <LinkButton href="https://example.com" external variant="ghost">
              外部文档
            </LinkButton>
          </Flex>
          <Flex gap="xs" align="center">
            <IconButton icon={Settings} aria-label="设置" class="icon-button-demo" />
            <IconButton icon={Trash2} aria-label="删除" tone="danger" variant="soft" />
            <IconButton icon={Plus} aria-label="添加" variant="solid" radius="full" />
            <CloseButton />
            <CopyButton value="npm i @vue-tsx-pro/ui" class="copy-button-demo" />
            <ClearButton size="sm" />
          </Flex>
        </Section>

        <Section title="导航 Tabs · Toolbar · Steps">
          <Tabs class="tabs-demo" value={_bind(orderTab)}>
            <TabList aria-label="订单状态">
              <Tab value="all">全部</Tab>
              <Tab value="paid">已付款</Tab>
              <Tab value="refund" disabled>
                退款中
              </Tab>
              <Tab value="done">已完成</Tab>
            </TabList>
            <TabPanel value="all">全部订单的列表</TabPanel>
            <TabPanel value="paid">已付款的订单</TabPanel>
            <TabPanel value="refund">退款中的订单</TabPanel>
            <TabPanel value="done">已完成的订单</TabPanel>
          </Tabs>
          <Tabs variant="soft" activation="manual" class="tabs-soft-demo">
            <TabList aria-label="时间范围">
              <Tab value="day">日</Tab>
              <Tab value="week">周</Tab>
              <Tab value="month">月</Tab>
            </TabList>
            <TabPanel value="day">今天的数据</TabPanel>
            <TabPanel value="week">本周的数据</TabPanel>
            <TabPanel value="month">本月的数据</TabPanel>
          </Tabs>
          <Breadcrumbs
            class="breadcrumbs-demo"
            maxItems={3}
            items={[
              { label: '首页', href: '/', icon: House },
              { label: '组件', href: '/base' },
              { label: '导航', href: '/base#nav' },
              { label: '面包屑' },
            ]}
          />
          <Pagination
            class="pagination-demo"
            page={_bind(page)}
            total={320}
            pageSize={20}
            showTotal
          />
          <NavList aria-label="演示站点" class="navlist-demo" sx={styles.narrow}>
            <NavItem href="/" icon={House}>
              首页
            </NavItem>
            <NavItem href="/base" icon={LayoutGrid}>
              基础组件
            </NavItem>
            <NavItem href="/pilot" icon={FlaskConical}>
              试点
            </NavItem>
            <NavGroup label="个人主页" icon={UserRound}>
              <NavItem href="/profile/1">用户 1</NavItem>
              <NavItem href="/profile/42">用户 42</NavItem>
            </NavGroup>
          </NavList>
          <Toolbar aria-label="文字格式" class="toolbar-demo">
            <IconButton icon={Bold} aria-label="加粗" />
            <IconButton icon={Italic} aria-label="斜体" />
            <IconButton icon={AlignLeft} aria-label="左对齐" />
            <IconButton icon={AlignCenter} aria-label="居中" />
            <IconButton icon={AlignRight} aria-label="右对齐" />
          </Toolbar>
          <Steps
            class="steps-demo"
            aria-label="下单步骤"
            current={step}
            onStepChange={(index) => (step = index)}
            items={[
              { title: '填写信息', description: '收货地址与联系方式' },
              { title: '确认订单', description: '核对商品与金额' },
              { title: '支付' },
              { title: '完成' },
            ]}
          />
          <Flex gap="sm">
            <Button variant="soft" tone="neutral" disabled={step === 0} onClick={() => step--}>
              上一步
            </Button>
            <Button class="steps-next" disabled={step === 3} onClick={() => step++}>
              下一步
            </Button>
          </Flex>
        </Section>

        <Section title="标记与提示 Badge · Tag · Alert">
          {(['solid', 'soft', 'surface', 'outline'] as const).map((variant) => (
            <Flex key={variant} gap="sm" wrap align="center" class={`badge-row-${variant}`}>
              {(['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const).map(
                (tone) => (
                  <Badge key={tone} variant={variant} tone={tone}>
                    {tone}
                  </Badge>
                ),
              )}
            </Flex>
          ))}
          <Flex gap="sm" wrap align="center" class="tag-demo" ref={_toRef(tagList)}>
            {cities.map((city) => (
              <Tag
                key={city}
                variant="surface"
                onRemove={() =>
                  void tagLayout.change(() => (cities = cities.filter((c) => c !== city)))
                }
              >
                {city}
              </Tag>
            ))}
          </Flex>
          {showAlert && (
            <Alert
              class="alert-demo"
              tone="warning"
              title="即将过期"
              onClose={() => (showAlert = false)}
            >
              你的订阅将在 3 天后到期，到期后无法使用高级功能。
            </Alert>
          )}
          <Alert tone="success" variant="surface" title="已保存" />
          <Alert
            tone="danger"
            variant="outline"
            action={
              <Button size="sm" variant="soft" tone="danger">
                重试
              </Button>
            }
          >
            网络连接失败
          </Alert>
        </Section>

        <Section title="对话框 Dialog · AlertDialog · Drawer">
          <Flex gap="sm" wrap align="center">
            <Button class="dialog-open" onClick={() => (dialogOpen = true)}>
              编辑资料
            </Button>
            <Button
              class="confirm-open"
              variant="soft"
              tone="danger"
              icon={Trash2}
              onClick={() => (confirmOpen = true)}
            >
              删除项目
            </Button>
            <Button class="drawer-open" variant="outline" onClick={() => (drawerOpen = true)}>
              筛选
            </Button>
            <Button class="confirm-imperative" variant="soft" onClick={() => void clearCart()}>
              清空购物车（useConfirm）
            </Button>
            <Text tone="muted" class="cart-result">
              {cartResult}
            </Text>
            <Text tone="muted" class="deleted-count">
              已删除 {deleted} 个
            </Text>
          </Flex>
          <Dialog
            open={_bind(dialogOpen)}
            class="dialog-demo"
            title="编辑资料"
            description="修改后立即生效。"
            footer={
              <>
                <Button variant="soft" tone="neutral" onClick={() => (dialogOpen = false)}>
                  取消
                </Button>
                <Button onClick={() => (dialogOpen = false)}>保存</Button>
              </>
            }
          >
            {Array.from({ length: 12 }, (_, index) => (
              <Paragraph key={index}>
                第 {index + 1} 段内容：正文较长时只滚动这里，标题与按钮固定。
              </Paragraph>
            ))}
          </Dialog>
          <AlertDialog
            open={_bind(confirmOpen)}
            class="confirm-demo"
            tone="danger"
            title="删除这个项目？"
            description="删除后无法恢复。"
            confirmText="删除"
            onConfirm={() =>
              new Promise<void>((resolve) =>
                setTimeout(() => {
                  deleted++;
                  resolve();
                }, 300),
              )
            }
          />
          <Drawer
            open={_bind(drawerOpen)}
            class="drawer-demo"
            title="筛选"
            footer={<Button onClick={() => (drawerOpen = false)}>应用</Button>}
          >
            <Paragraph>筛选条件放在这里。</Paragraph>
          </Drawer>
        </Section>

        <Section title="表单 Field · TextField · NumberField · Textarea · Checkbox · Radio · Switch">
          <GridList minItemWidth="16em" gap="lg" class="form-demo">
            <li>
              <Field
                label="邮箱"
                description="用于找回密码"
                error={email && !email.includes('@') ? '邮箱格式不对' : undefined}
                required
              >
                <TextField
                  value={_bind(email)}
                  type="email"
                  clearable
                  placeholder="name@example.com"
                />
              </Field>
            </li>
            <li>
              <Field label="密码">
                <TextField value={_bind(password)} type="password" />
              </Field>
            </li>
            <li>
              <Field label="个人主页">
                <TextField
                  value={_bind(homepage)}
                  prefix="https://"
                  suffix=".dev"
                  class="affix-demo"
                />
              </Field>
            </li>
            <li>
              <Field label="数量" description="1–99">
                <NumberField value={_bind(quantity)} min={1} max={99} />
              </Field>
            </li>
            <li>
              <Field label="备注">
                <Textarea value={_bind(note)} rows={2} maxRows={6} maxlength={200} showCount />
              </Field>
            </li>
            <li>
              <Field label="通知方式">
                <CheckboxGroup value={_bind(channels)}>
                  <Checkbox value="email">邮件</Checkbox>
                  <Checkbox value="sms">短信</Checkbox>
                  <Checkbox value="push" disabled>
                    推送（即将上线）
                  </Checkbox>
                </CheckboxGroup>
              </Field>
            </li>
            <li>
              <Field label="配送方式">
                <RadioGroup value={_bind(shipping)}>
                  <Radio value="express">快递</Radio>
                  <Radio value="pickup">到店自提</Radio>
                </RadioGroup>
              </Field>
            </li>
            <li>
              <Field label="城市（单选）">
                <Select
                  items={cityOptions}
                  value={_bind(city)}
                  name="city"
                  propsRoot={{ class: 'select-demo' }}
                />
              </Field>
            </li>
            <li>
              <Field label="城市（多选）">
                <Select
                  items={cityOptions}
                  selectionMode="multiple"
                  value={_bind(pickedCities)}
                  clearable
                  propsRoot={{ class: 'select-multiple-demo' }}
                />
              </Field>
            </li>
            <li>
              <Field label="编号（一万个选项）">
                <Select
                  items={manyOptions}
                  value={_bind(serial)}
                  propsRoot={{ class: 'select-many-demo' }}
                />
              </Field>
            </li>
            <li>
              <Field label="编程语言" description="输入可以过滤">
                <Combobox
                  items={languageOptions}
                  value={_bind(language)}
                  clearable
                  propsRoot={{ class: 'combobox-demo' }}
                />
              </Field>
            </li>
            <li>
              <Field label="水果">
                <Listbox items={fruitOptions} value={_bind(fruit)} class="listbox-demo" />
              </Field>
            </li>
            <li>
              <Empty
                title="还没有订单"
                description="下单后会显示在这里。"
                action={<Button size="sm">去逛逛</Button>}
              />
            </li>
            <li>
              <Flex direction="column" gap="sm">
                <Switch checked={_bind(notify)}>接收通知</Switch>
                <Switch
                  class="switch-loading-demo"
                  checked={autoSave}
                  loading={savingSwitch}
                  checkedContent="开"
                  uncheckedContent="关"
                  onChange={toggleAutoSave}
                >
                  自动保存（切换要等 1 秒）
                </Switch>
                <Checkbox class="agree-demo" checked={_bind(agreed)}>
                  我已阅读并同意服务条款
                </Checkbox>
              </Flex>
            </li>
          </GridList>
        </Section>

        <Section title="表单校验 useForm · zod">
          <FormDemo />
        </Section>

        <Section title="表格 Table · TreeTable">
          <TableDemo />
        </Section>

        <Section title="浮层 Popover · Tooltip · Menu">
          <Flex gap="sm" wrap align="center">
            <Popover
              class="popover-demo"
              trigger={(props) => (
                <Button {...props} variant="outline" class="popover-open">
                  筛选条件
                </Button>
              )}
            >
              <Flex direction="column" gap="sm">
                <Text>只显示已完成的订单</Text>
                <Button size="sm">应用</Button>
              </Flex>
            </Popover>
            <Tooltip
              class="tooltip-demo"
              trigger={(props) => (
                <IconButton {...props} icon={Copy} aria-label="复制" class="tooltip-trigger" />
              )}
            >
              复制链接（Ctrl+C）
            </Tooltip>
            <Tooltip
              trigger={(props) => <IconButton {...props} icon={Settings} aria-label="设置" />}
            >
              设置
            </Tooltip>
            <Menu
              class="menu-demo"
              trigger={(props) => (
                <Button {...props} variant="outline" iconEnd={ChevronDown} class="menu-open">
                  操作
                </Button>
              )}
            >
              <MenuItem icon={Pencil} onAction={() => (menuAction = '编辑')}>
                编辑
              </MenuItem>
              <MenuItem icon={Copy} shortcut="Ctrl+D" onAction={() => (menuAction = '复制')}>
                复制
              </MenuItem>
              <MenuItem disabled>归档</MenuItem>
              <Separator decorative={false} />
              <MenuGroup label="视图">
                <MenuCheckboxItem checked={_bind(showGrid)}>显示网格</MenuCheckboxItem>
              </MenuGroup>
              <MenuRadioGroup label="排序" value={_bind(sortBy)}>
                <MenuRadioItem value="name">按名称</MenuRadioItem>
                <MenuRadioItem value="date">按日期</MenuRadioItem>
              </MenuRadioGroup>
              <Separator decorative={false} />
              <MenuItem icon={Trash2} tone="danger" onAction={() => (menuAction = '删除')}>
                删除
              </MenuItem>
            </Menu>
            <Text tone="muted" class="menu-result">
              {menuAction ? `执行了：${menuAction}` : '未执行'} · 网格{showGrid ? '开' : '关'} ·
              排序 {sortBy}
            </Text>
          </Flex>
        </Section>

        <Section title="通知 Toast">
          <Flex gap="sm" wrap align="center">
            <Button
              class="toast-success"
              variant="soft"
              onClick={() => toaster.show({ tone: 'success', title: '已保存' })}
            >
              保存
            </Button>
            <Button class="toast-action" variant="soft" onClick={notifyUndo}>
              删除（可撤销）
            </Button>
            <Button class="toast-promise" variant="soft" onClick={upload}>
              上传
            </Button>
            <Switch class="toast-stack" checked={_bind(stackToasts)}>
              叠放
            </Switch>
          </Flex>
        </Section>

        <Section title="进度与占位 Progress · Skeleton · LoadingOverlay">
          <Progress class="progress-demo" value={volume} aria-label="演示进度" />
          <Progress tone="success" value={100} aria-label="已完成" />
          <Progress class="progress-indeterminate" aria-label="正在加载" />
          <Card
            class="card-demo"
            header={
              <Flex gap="md" align="center">
                <Skeleton loading={loadingProfile}>
                  <Avatar name="Ada Lovelace" size="lg" />
                </Skeleton>
                <Skeleton loading={loadingProfile}>
                  <Text weight="semibold">Ada Lovelace</Text>
                </Skeleton>
              </Flex>
            }
            footer={
              <Button variant="soft" onClick={() => (loadingProfile = !loadingProfile)}>
                {loadingProfile ? '加载完成' : '重新加载'}
              </Button>
            }
          >
            <Skeleton loading={loadingProfile}>
              <Paragraph>第一位程序员，为分析机写出了第一个算法。</Paragraph>
            </Skeleton>
          </Card>
          <LoadingOverlay class="overlay-demo" loading={refreshing} blur>
            <Card
              footer={
                <Button variant="soft" class="overlay-trigger" onClick={refresh}>
                  刷新（1.5 秒）
                </Button>
              }
            >
              <Paragraph>刷新时遮罩盖住卡片，内容保留；很快完成的加载不出现遮罩。</Paragraph>
            </Card>
          </LoadingOverlay>
          <Flex gap="sm" align="center">
            <Avatar name="张三" />
            <Avatar name="Grace Hopper" radius="md" />
            <Avatar />
          </Flex>
        </Section>

        <Section title="图标 Icon">
          <div {...stylex.attrs(styles.row)}>
            <Icon icon={Star} size="xs" />
            <Icon icon={Star} size="sm" />
            <Icon icon={Star} size="md" />
            <Icon icon={Star} size="lg" />
            <Icon icon={Star} size="xl" />
            <Icon icon={ArrowRight} flipInRtl />
          </div>
        </Section>

        <Section title="读屏文字 VisuallyHidden">
          <div {...stylex.attrs(styles.row)}>
            <button type="button" class="icon-only" {...stylex.attrs(styles.iconButton)}>
              <Icon icon={Settings} />
              <VisuallyHidden>设置</VisuallyHidden>
            </button>
          </div>
        </Section>

        <Section title="文本 H1–H6 · Text · Paragraph · Strong · Small · Link · Code · Kbd">
          <H3 class="heading-demo">三级标题</H3>
          <H4>四级标题</H4>
          <Paragraph tone="muted" size="sm">
            次要说明文字
          </Paragraph>
          <Flex gap="sm" wrap>
            {(['accent', 'danger', 'success', 'warning', 'info'] as const).map((tone) => (
              <Text key={tone} tone={tone} weight="medium">
                {tone}
              </Text>
            ))}
          </Flex>
          <Paragraph class="clamp-demo" lineClamp={2} {...stylex.attrs(styles.narrow)}>
            多行截断：这是一段比较长的说明文字，超过两行之后会被截断并在末尾显示省略号，完整内容不会撑开布局。
            这一句话会被隐藏起来，用来确认截断确实生效。
          </Paragraph>
          <Paragraph>
            <Strong>提示：</Strong>阅读 <Link href="#">使用说明</Link>，或查看{' '}
            <Link href="https://example.com" external class="external-demo">
              外部文档
            </Link>
            ；运行 <Code>pnpm install</Code>，按 <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> 搜索。
          </Paragraph>
          <Small class="small-demo" tone="muted">
            © 2026 vue-tsx-pro
          </Small>
        </Section>

        <Section title="代码块 CodeBlock（Shiki 高亮）">
          <CodeBlock class="codeblock-demo" lang="tsx" code={sampleCode} />
          <CodeBlock class="codeblock-plain" code="pnpm add @vue-tsx-pro/ui shiki" />
        </Section>

        <Section title="布局 Flex · GridList · Container · Separator">
          <Flex class="flex-demo" gap="sm" align="center" wrap>
            <span {...stylex.attrs(styles.card)}>一</span>
            <span {...stylex.attrs(styles.card)}>二</span>
            <Separator class="separator-demo" orientation="vertical" decorative={false} />
            <span {...stylex.attrs(styles.card)}>三</span>
          </Flex>
          <GridList class="grid-demo" minItemWidth="10em" gap="md">
            {['甲', '乙', '丙', '丁', '戊', '己'].map((name) => (
              <li key={name} {...stylex.attrs(styles.card)}>
                {name}
              </li>
            ))}
          </GridList>
          <Separator />
          <Container
            class="container-demo"
            size="xs"
            padding="md"
            {...stylex.attrs(styles.outlined)}
          >
            <p {...stylex.attrs(styles.paragraph)}>最大宽度 30rem，水平居中</p>
          </Container>
        </Section>

        <Section title="滚动区域 ScrollArea">
          <ScrollArea
            class="scroll-demo"
            sx={styles.scrollBox}
            propsViewport={{ 'aria-label': '滚动区域演示' }}
          >
            {Array.from({ length: 30 }, (_, index) => (
              <p key={index} {...stylex.attrs(styles.scrollLine)}>
                第 {index + 1} 行：滚动条浮在内容上方，出现和消失都不改变布局
              </p>
            ))}
          </ScrollArea>
          <ScrollArea
            class="scroll-both-demo"
            axis="both"
            type="always"
            sx={styles.scrollBox}
            propsViewport={{ 'aria-label': '两个方向都能滚动的演示' }}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <p key={index} {...stylex.attrs(styles.wide)}>
                横向也能滚动：这一行比容器宽，第 {index + 1} 行
              </p>
            ))}
          </ScrollArea>
        </Section>

        <Section title="滑块 Slider">
          <Flex gap="md" align="center">
            <Slider
              class="slider-demo"
              value={_bind(volume)}
              aria-label="音量"
              valueText={(value) => `${value}%`}
              propsRoot={{ class: 'slider-root', sx: styles.slider }}
            />
            <Text class="slider-value">{volume}%</Text>
          </Flex>
          <Flex gap="md" align="center">
            <Slider
              class="slider-range-demo"
              value={_bind(priceRange)}
              max={1000}
              step={50}
              marks={[
                0,
                { value: 250, label: '250' },
                { value: 500, label: '500' },
                { value: 750, label: '750' },
                1000,
              ]}
              aria-label="价格"
              valueText={(value) => `${value} 元`}
              propsRoot={{ class: 'slider-range-root', sx: styles.slider }}
            />
            <Text class="slider-range-value">
              {priceRange[0]}–{priceRange[1]} 元
            </Text>
          </Flex>
        </Section>

        <Section title="切换按钮组 ToggleGroup">
          <Flex gap="md" align="center" wrap>
            <ToggleGroup class="toggle-single" value={_bind(view)} required aria-label="视图">
              <ToggleItem value="list" icon={List}>
                列表
              </ToggleItem>
              <ToggleItem value="grid" icon={LayoutGrid}>
                网格
              </ToggleItem>
            </ToggleGroup>
            <ToggleGroup
              class="toggle-multiple"
              selectionMode="multiple"
              value={_bind(marks)}
              aria-label="格式"
            >
              <ToggleItem value="bold" icon={Bold} aria-label="加粗" />
              <ToggleItem value="italic" icon={Italic} aria-label="斜体" />
              <ToggleItem value="underline" icon={Underline} aria-label="下划线" />
            </ToggleGroup>
          </Flex>
        </Section>

        <Section title="拖动验证 SlideVerify">
          <div {...stylex.attrs(styles.verify)}>
            <SlideVerify class="verify-demo" status={verifyStatus} onRelease={verifySlide} />
          </div>
          <Button variant="outline" class="verify-reset" onClick={() => (verifyStatus = 'idle')}>
            重置
          </Button>
          <div class="puzzle-demo" {...stylex.attrs(styles.puzzle)}>
            <div {...stylex.attrs(styles.piece, styles.gap, pieceStyles.left(puzzleTarget))} />
            <div {...stylex.attrs(styles.piece, styles.block, pieceStyles.left(puzzlePosition))} />
          </div>
          <div {...stylex.attrs(styles.verify)}>
            <SlideVerify
              class="puzzle-verify"
              target="free"
              position={_bind(puzzlePosition)}
              status={puzzleStatus}
              hint="拖动滑块，把方块放进缺口"
              onRelease={verifyPuzzle}
            />
          </div>
          <Button variant="outline" onClick={resetPuzzle}>
            换一张
          </Button>
        </Section>

        <Section title="虚拟列表 VirtualList">
          <Flex gap="sm">
            <Button
              variant="outline"
              class="scroll-to-row"
              onClick={() => listHandle?.scrollToIndex(5000, { align: 'start' })}
            >
              跳到第 5001 行
            </Button>
          </Flex>
          <VirtualList
            class="virtual-demo"
            items={rows}
            itemKey={(row) => row.id}
            estimateSize={30}
            aria-label="一万行演示数据"
            handle={(handle) => (listHandle = handle)}
            sx={styles.virtualList}
          >
            {(row) => <div {...stylex.attrs(styles.virtualRow)}>{row.text}</div>}
          </VirtualList>
        </Section>

        <Section title="折叠 Collapsible">
          <Collapsible
            class="details"
            trigger={(props) => (
              <Button variant="outline" class="details-trigger" {...props}>
                高级选项
              </Button>
            )}
          >
            <p {...stylex.attrs(styles.paragraph)}>
              收起时内容带
              hidden=&quot;until-found&quot;：用浏览器的页内搜索找“隐藏的关键词”会自动展开。
            </p>
          </Collapsible>
        </Section>

        <Section title="动效 Anime.js">
          <MotionDemo />
        </Section>
      </main>
      <Toaster controller={toaster} class="toaster-demo" progress stack={stackToasts} />
    </Provider>
  );
});
