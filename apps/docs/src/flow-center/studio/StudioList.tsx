/**
 * 流程工作室的列表（只给管理员）：全部流程（含停用的）、最新一版、发布过几版、谁什么时候发的；启停；新建从模板或空白开始。
 * 点一行进编辑页。
 */
import { Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { CatalogEntry } from '@zerodep-dev/flow-ts-engine';
import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  Flex,
  H2,
  Small,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { useFormDialog } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { timeText, who } from '../parts/labels';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';
import { STARTERS } from './project';

export default _component(() => {
  const center = useFlowCenter();
  const router = useRouter();
  const prompt = useFormDialog();
  let entries = _state.raw<readonly CatalogEntry[] | null>(null);

  watch(
    () => [center.state.revision, center.state.actor] as const,
    async () => {
      if (!center.admin()) return;
      try {
        entries = await center.client.versions.catalog();
      } catch (error) {
        showError(error);
      }
    },
    { immediate: true },
  );

  async function toggle(entry: CatalogEntry) {
    try {
      await center.client.versions.setEnabled(entry.key, !entry.startable);
      toaster.success(entry.startable ? `已停用“${entry.name}”` : `已启用“${entry.name}”`);
    } catch (error) {
      showError(error);
    }
  }

  async function create() {
    const taken = new Set((entries ?? []).map((e) => e.key));
    const answers = await prompt({
      title: '新建流程',
      description: '发布之前只在这个页面里；发布后出现在发起中心。',
      fields: [
        {
          name: 'starter',
          label: '从哪开始',
          type: 'select',
          required: true,
          defaultValue: 'blank',
          options: STARTERS.map((s) => ({ value: s.id, label: s.title, description: s.text })),
        },
        {
          name: 'key',
          label: '流程的键',
          required: true,
          placeholder: '如 overtime',
          description: '小写字母开头，字母、数字、连字符；发布后不能改',
          validate: (value) =>
            !/^[a-z][a-z0-9-]*$/.test(value)
              ? '小写字母开头，只用字母、数字、连字符'
              : taken.has(value)
                ? '已经有这个流程了'
                : null,
        },
        { name: 'name', label: '名字', required: true, placeholder: '如 加班申请' },
      ],
      confirmText: '新建',
    });
    if (!answers) return;
    void router.push({
      path: `/flow/studio/${answers.key}`,
      query: { starter: answers.starter, name: answers.name },
    });
  }

  const columns: DataTableColumn<CatalogEntry>[] = [
    { key: 'name', header: '流程', minWidth: 160 },
    { key: 'key', header: '键', width: 120 },
    { key: 'version', header: '最新版', width: 90, cell: (e) => `第 ${e.version} 版` },
    { key: 'versions', header: '发布过', width: 80, cell: (e) => `${e.versions} 版` },
    {
      key: 'startable',
      header: '状态',
      width: 90,
      cell: (e) =>
        e.startable ? <Badge tone="success">能发起</Badge> : <Badge tone="neutral">已停用</Badge>,
    },
    {
      key: 'publishedAt',
      header: '发布',
      minWidth: 160,
      cell: (e) =>
        `${e.publishedBy ? who(e.publishedBy) : '系统'} · ${timeText(e.publishedAt, center.state.now)}`,
    },
    { key: 'note', header: '说明', minWidth: 160, cell: (e) => e.note ?? '—' },
    {
      key: 'actions',
      header: '',
      width: 90,
      cell: (e) => (
        <Button size="sm" variant="ghost" tone="neutral" onClick={() => void toggle(e)}>
          {e.startable ? '停用' : '启用'}
        </Button>
      ),
    },
  ];

  return () => {
    if (!center.admin())
      return (
        <Alert
          tone="warning"
          title="只有管理员能用工作室"
          description="顶栏把演示身份换成顾承远（总经理）。"
        />
      );
    return (
      <Flex direction="column" gap="lg">
        <Flex align="center" justify="between" gap="md" wrap>
          <Flex direction="column" gap="xs">
            <H2>流程工作室</H2>
            <Small tone="muted">
              流程就是一个小工程：图（process.json）、单据（form.ts）、逻辑（logic.ts）；改完检查、发布成新的一版。
            </Small>
          </Flex>
          <Button icon={Plus} onClick={() => void create()}>
            新建流程
          </Button>
        </Flex>
        <Card padding="sm">
          <DataTable
            aria-label="流程"
            rows={entries ?? []}
            loading={entries === null}
            columns={columns}
            getKey={(e) => e.key}
            onRowClick={(e) => void router.push(`/flow/studio/${e.key}`)}
          />
        </Card>
      </Flex>
    );
  };
});
