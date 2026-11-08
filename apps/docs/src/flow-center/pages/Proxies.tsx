/**
 * 代理（docs/decisions/0010 第 3 节）：我不在（休假、出差）的这段时间、这些流程，新到我手上的待办交给代理人；
 * 已经在手上的不动（要交出去用转办）。下面列出我设的（撤销）与别人交给我的。管理员可以替别人设。
 */
import { getLocalTimeZone } from '@internationalized/date';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { ProxyView } from '@zerodep-dev/flow-ts-engine';
import {
  Badge,
  Button,
  Card,
  DateRangePicker,
  Empty,
  Field,
  ItemList,
  ItemListItem,
  Select,
  Small,
  TextField,
  type DateRange,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { watch } from 'vue';
import { PROCESSES } from '../processes';
import { timeText, who } from '../parts/labels';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';

const styles = css.create({
  page: { display: 'flex', flexDirection: 'column', gap: '_lg', maxWidth: '56rem' },
  body: { display: 'flex', flexDirection: 'column', gap: '_md' },
  form: {
    display: 'grid',
    gap: '_md',
    gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
    alignItems: 'start',
  },
  actions: { display: 'flex', justifyContent: 'end' },
});

const processItems = PROCESSES.map((p) => ({ value: p.definition.key, label: p.definition.name }));
const processName = (key: string) => processItems.find((p) => p.value === key)?.label ?? key;

export default _component(() => {
  const center = useFlowCenter();
  let lists = _state.raw<{ mine: ProxyView[]; forMe: ProxyView[] } | null>(null);
  let principal = _state<string | null>(null);
  let agent = _state<string | null>(null);
  let processes = _state<string[]>([]);
  let period = _state.raw<DateRange | null>(null);
  let note = _state('');
  let saving = _state(false);

  watch(
    () => [center.state.revision, center.state.actor] as const,
    async () => {
      try {
        lists = await center.client.proxies.list();
      } catch (error) {
        showError(error);
      }
    },
    { immediate: true },
  );

  async function save() {
    if (!agent) return;
    const timeZone = getLocalTimeZone();
    saving = true;
    try {
      await center.client.proxies.save({
        ...(principal ? { principal } : {}),
        agent,
        processKeys: processes,
        // 按本地的日子：开始日的零点到结束日过完
        ...(period
          ? {
              startsAt: period.start.toDate(timeZone),
              endsAt: period.end.add({ days: 1 }).toDate(timeZone),
            }
          : {}),
        note,
      });
      toaster.success(`设好了：${who(agent)}代理`);
      agent = null;
      processes = [];
      period = null;
      note = '';
    } catch (error) {
      showError(error);
    } finally {
      saving = false;
    }
  }

  async function cancel(proxy: ProxyView) {
    try {
      await center.client.proxies.cancel(proxy.id);
      toaster.success('撤销了');
    } catch (error) {
      showError(error);
    }
  }

  /** 哪些流程、哪段时间 */
  const scopeText = (proxy: ProxyView) => {
    const now = center.state.now;
    const flows = proxy.processKeys.length
      ? proxy.processKeys.map(processName).join('、')
      : '全部流程';
    const until = proxy.endsAt ? `到 ${timeText(proxy.endsAt, now)}` : '直到撤销';
    return `${flows} · ${timeText(proxy.startsAt, now)} 起，${until}${proxy.note ? ` · ${proxy.note}` : ''}`;
  };

  const status = (proxy: ProxyView) =>
    proxy.active ? <Badge tone="success">生效中</Badge> : <Badge tone="neutral">还没开始</Badge>;

  function renderList(rows: ProxyView[], mine: boolean) {
    if (rows.length === 0) return <Empty title={mine ? '没有设代理' : '没有人交给你'} />;
    return (
      <ItemList aria-label={mine ? '我设的代理' : '交给我的'}>
        {rows.map((proxy) => (
          <ItemListItem
            key={proxy.id}
            title={mine ? `${who(proxy.agent)}代理` : `代${who(proxy.principal)}`}
            description={scopeText(proxy)}
            end={
              <>
                {status(proxy)}
                {mine && (
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="danger"
                    onClick={() => void cancel(proxy)}
                  >
                    撤销
                  </Button>
                )}
              </>
            }
          />
        ))}
      </ItemList>
    );
  }

  return () => (
    <div {...css.attrs(styles.page)}>
      <Card padding="lg" header="我不在的时候">
        <div {...css.attrs(styles.body)}>
          <Small tone="muted">
            这段时间、这些流程新到你手上的待办交给代理人，待办上写着“代你”；已经在手上的不动，要交出去用转办。
          </Small>
          <div {...css.attrs(styles.form)}>
            {center.admin() && (
              <Field label="替谁设" description="管理员可以替别人设；不选是自己">
                <Select items={center.people()} _value={principal} placeholder="自己" clearable />
              </Field>
            )}
            <Field label="代理人" required>
              <Select items={center.people()} _value={agent} placeholder="选人" />
            </Field>
            <Field label="哪些流程" description="不选是全部">
              <Select
                items={processItems}
                selectionMode="multiple"
                _value={processes}
                placeholder="全部流程"
                clearable
              />
            </Field>
            <Field label="哪几天" description="不选是从现在起、直到撤销">
              <DateRangePicker _value={period} clearable />
            </Field>
            <Field label="说明">
              <TextField _value={note} placeholder="如：休年假" />
            </Field>
          </div>
          <div {...css.attrs(styles.actions)}>
            <Button loading={saving} disabled={!agent} onClick={() => void save()}>
              设代理
            </Button>
          </div>
        </div>
      </Card>
      <Card padding="lg" header="我设的代理">
        {lists && renderList(lists.mine, true)}
      </Card>
      <Card padding="lg" header="别人交给我的">
        {lists && renderList(lists.forMe, false)}
      </Card>
    </div>
  );
});
