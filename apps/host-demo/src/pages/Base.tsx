// 基础组件演示（文档站暂缓，先在这里按分类演示）：每加一批组件就加一节
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bold,
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
  Icon,
  IconButton,
  Kbd,
  lightTheme,
  Link,
  LinkButton,
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
  themeTransition,
  VirtualList,
  VisuallyHidden,
  type VirtualListHandle,
} from '@vue-tsx-pro/ui';
import { animate } from 'animejs';
import type { VNodeChild } from 'vue';

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
  track: {
    // 小球的宽度加上移动的距离
    width: 'calc(_control + 120px)',
    padding: '_xs',
    borderRadius: '_full',
    backgroundColor: '_fill',
  },
  ball: {
    width: '_control',
    height: '_control',
    borderRadius: '_full',
    backgroundColor: '_accent',
  },
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

/** /base 演示页：按分类演示组件库的基础组件，浏览器测试与 axe 检查也跑在这一页上 */
export const Base = _component(() => {
  let dark = _state(false);
  let ball = _state.raw<HTMLElement | null>(null);
  let moved = false;
  let listHandle: VirtualListHandle | undefined;
  let volume = _state(40);
  let saving = _state(false);
  let cities = _state(['上海', '北京', '深圳']);
  let loadingProfile = _state(true);
  let showAlert = _state(true);
  let dialogOpen = _state(false);
  let drawerOpen = _state(false);
  let confirmOpen = _state(false);
  let deleted = _state(0);
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

  // JS 动画：Anime.js 的 animate 加上主题的弹簧时长；减少动态效果时立即到位
  function move() {
    moved = !moved;
    animate(ball!, {
      x: moved ? 120 : 0,
      ...themeTransition(ball!, { duration: 'lg', bounce: 0.3 }),
    });
  }

  return () => (
    <Provider theme={dark ? darkTheme : lightTheme}>
      <main {...stylex.attrs(styles.page)}>
        <div {...stylex.attrs(styles.row)}>
          <Button variant="outline" class="toggle-theme" onClick={() => (dark = !dark)}>
            {dark ? '亮色' : '暗色'}
          </Button>
        </div>

        <Section title="按钮 Button · LinkButton · IconButton">
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
          <Flex gap="sm" wrap align="center" class="tag-demo">
            {cities.map((city) => (
              <Tag
                key={city}
                variant="surface"
                onRemove={() => (cities = cities.filter((c) => c !== city))}
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

        <Section title="进度与占位 Progress · Skeleton">
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
              type="multiple"
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
          <div {...stylex.attrs(styles.row)}>
            <Button variant="outline" class="move-ball" onClick={move}>
              移动
            </Button>
            <div {...stylex.attrs(styles.track)}>
              <div class="ball" ref={_toRef(ball)} {...stylex.attrs(styles.ball)} />
            </div>
          </div>
        </Section>
      </main>
    </Provider>
  );
});
