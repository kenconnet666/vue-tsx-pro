/**
 * 流程中心的应用外壳（docs/decisions/0009）：侧栏是工作台、发起、单据、工作室与管理（管理员）；顶栏是演示身份（谁在用）、通知铃铛、演示时钟（快进看超时与提醒）、
 * 重置演示数据、回文档。第一次打开时 Worker 要建表、发布流程、写种子，先显示进度。
 */
import {
  BookOpen,
  Code,
  FastForward,
  Files,
  Inbox,
  RotateCcw,
  Send,
  ShieldCheck,
  Workflow,
} from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Alert,
  Button,
  Card,
  Flex,
  LinkButton,
  Menu,
  MenuItem,
  NavItem,
  NavList,
  NavSection,
  Progress,
  Provider,
  Select,
  Small,
  Toaster,
  useConfirm,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { AppShell, AppShellBrand, ThemeSwitcher } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { computed, onMounted, watch } from 'vue';
import { RouterView } from 'vue-router';
import { preference } from '../site/theme';
import { formSourcesOf } from './domain/sources';
import { NotificationBell } from './parts/NotificationBell';
import { timeText } from './parts/labels';
import { toaster } from './parts/toaster';
import { useFlowCenter, type FlowCenter } from './runtime/center';

const styles = css.create({
  tools: { display: 'flex', alignItems: 'center', gap: '_sm', marginInlineStart: 'auto' },
  loading: { maxWidth: '28rem', marginInline: 'auto', marginBlockStart: '20vh' },
  identity: { minWidth: '11rem' },
});

export default _component(() => {
  // Worker 只在浏览器里建：服务端渲染不到这里（流程中心不预渲染）
  let center = _state.raw<FlowCenter | null>(null);
  let todoCount = _state(0);
  const confirm = useConfirm();
  onMounted(() => (center = useFlowCenter()));
  // 组织换了（重置、管理页改过）才重建
  const sources = computed(() => {
    const org = center?.state.org;
    return org ? formSourcesOf(org) : undefined;
  });

  // 待办数：数据变了、换了身份都重取
  watch(
    () => center && center.state.status === 'ready' && [center.state.revision, center.state.actor],
    async (ready) => {
      if (ready && center) todoCount = (await center.client.todo()).length;
    },
  );

  async function reset() {
    const ok = await confirm({
      title: '重置演示数据？',
      description: '删掉浏览器里的流程数据，重新发布流程、写种子。',
      tone: 'danger',
      confirmText: '重置',
    });
    if (ok) center?.reset();
  }

  function renderBody(current: FlowCenter) {
    const { state } = current;
    if (state.status === 'error')
      return (
        <div {...css.attrs(styles.loading)}>
          <Alert tone="danger" title="流程中心没能启动" description={state.error} />
        </div>
      );
    if (state.status === 'loading')
      return (
        <Card padding="lg" sx={styles.loading}>
          <Flex direction="column" gap="md">
            <Small tone="muted">
              第一次打开要在浏览器里建库、发布流程、写演示数据，之后刷新就快了。
            </Small>
            <Progress value={state.done} max={Math.max(state.total, 1)} label={state.step} />
          </Flex>
        </Card>
      );
    // 单据里的字典、选人、上传在整个流程中心登记一次
    return (
      <Provider formSources={sources.value}>
        <RouterView />
      </Provider>
    );
  }

  return () => {
    const current = center;
    return (
      <AppShell
        brand={
          <AppShellBrand href="/flow/work" icon={Workflow}>
            流程中心
          </AppShellBrand>
        }
        header={
          <div {...css.attrs(styles.tools)}>
            {current && (
              <>
                <Select
                  size="sm"
                  items={current.people()}
                  _value={current.state.actor}
                  onUpdate:_value={(id: string | null) => id && current.setActor(id)}
                  aria-label="演示身份"
                  sx={styles.identity}
                />
                {current.state.status === 'ready' && <NotificationBell />}
                <Small tone="muted">{timeText(current.state.now)}</Small>
                <Menu
                  trigger={(props) => (
                    <Button size="sm" variant="ghost" tone="neutral" icon={FastForward} {...props}>
                      快进
                    </Button>
                  )}
                >
                  <MenuItem onAction={() => current.advance(1)}>1 小时</MenuItem>
                  <MenuItem onAction={() => current.advance(24)}>1 天</MenuItem>
                  <MenuItem onAction={() => current.advance(72)}>3 天</MenuItem>
                </Menu>
                <Button
                  size="sm"
                  variant="ghost"
                  tone="neutral"
                  icon={RotateCcw}
                  onClick={() => void reset()}
                >
                  重置
                </Button>
              </>
            )}
            <LinkButton href="/stack/flow" size="sm" variant="ghost" tone="neutral" icon={BookOpen}>
              文档
            </LinkButton>
            <ThemeSwitcher preference={preference} />
          </div>
        }
        sidebar={
          <NavList aria-label="流程中心">
            <NavSection label="我的">
              <NavItem href="/flow/work" icon={Inbox} badge={todoCount || undefined}>
                工作台
              </NavItem>
              <NavItem href="/flow/start" icon={Send}>
                发起
              </NavItem>
              <NavItem href="/flow/documents" icon={Files}>
                单据
              </NavItem>
              {current?.admin() && (
                <>
                  <NavItem href="/flow/studio" icon={Code}>
                    工作室
                  </NavItem>
                  <NavItem href="/flow/admin" icon={ShieldCheck}>
                    管理
                  </NavItem>
                </>
              )}
            </NavSection>
          </NavList>
        }
      >
        {current ? renderBody(current) : null}
        <Toaster controller={toaster} />
      </AppShell>
    );
  };
});
