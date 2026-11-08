/**
 * 把进行中的单子迁到某一版（工作室的“版本”页签里）：先预览——每张单正在用的节点在那一版里有没有同名同类型的节点，
 * 对应得上的一键迁移（写原因，逐张成败）；对应不上的逐张“对应节点”：给每个没对上的节点从那一版同类型的节点里选一个再迁
 * （migrate 命令的 nodes），或让单子按原版本走完。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { MigrationCandidate, VersionInfo } from '@zerodep-dev/flow-ts-engine';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Field,
  Flex,
  Select,
  Small,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { useFormDialog } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { STATUS } from '../parts/labels';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';

/** MigrationPanel 的属性 */
export interface MigrationPanelProps {
  processKey: string;
  versions: readonly VersionInfo[];
}

export const MigrationPanel = _component(({ processKey, versions }: MigrationPanelProps) => {
  const center = useFlowCenter();
  const prompt = useFormDialog();
  /** 选的目标版本；没选时是最新版（发布了新版跟着变） */
  let picked = _state<string | null>(null);
  const latest = () => (versions[0] ? String(versions[0].version) : null);
  const target = () => picked ?? latest();
  let candidates = _state.raw<readonly MigrationCandidate[] | null>(null);
  let busy = _state(false);

  async function preview() {
    if (!target()) return;
    try {
      candidates = await center.client.versions.migrationPreview(processKey, Number(target()));
    } catch (error) {
      showError(error);
    }
  }

  async function migrate() {
    const ready = (candidates ?? []).filter((c) => c.ready);
    const answers = await prompt({
      title: `把 ${ready.length} 张单迁到第 ${target()} 版？`,
      description: '正在处理的环节换成新版本里同名的环节，待办与作业跟着换；流转记录里记一笔。',
      fields: [{ name: 'comment', label: '原因', type: 'textarea', required: true }],
      confirmText: '迁移',
    });
    if (!answers) return;
    busy = true;
    try {
      const results = await center.client.runMany(
        ready.map((c) => ({
          type: 'migrate',
          instance: c.instance,
          version: Number(target()),
          comment: answers.comment,
        })),
      );
      const failed = results.filter((r) => !r.ok).length;
      toaster.show({
        tone: failed ? 'warning' : 'success',
        title: `迁了 ${results.length - failed} 张${failed ? `，${failed} 张没迁成` : ''}`,
      });
      await preview();
    } catch (error) {
      showError(error);
    } finally {
      busy = false;
    }
  }

  /** 对应不上的一张：给没对上的节点选那一版里的节点，写原因，迁这一张 */
  async function mapAndMigrate(candidate: MigrationCandidate) {
    const unmatched = candidate.nodes.filter((n) => !n.target);
    const answers = await prompt({
      title: `把“${candidate.title ?? `#${candidate.instance}`}”迁到第 ${target()} 版`,
      description:
        '下面的环节在那一版里没有同名的：选它对应到哪个环节（只能选同类型的），待办与作业跟着换。',
      fields: [
        ...unmatched.map((n) => ({
          name: `node:${n.node}`,
          label: n.name,
          type: 'select' as const,
          required: true,
          options: n.choices.map((c) => ({ value: c.node, label: c.name })),
        })),
        { name: 'comment', label: '原因', type: 'textarea' as const, required: true },
      ],
      confirmText: '迁移',
    });
    if (!answers) return;
    busy = true;
    try {
      await center.client.run({
        type: 'migrate',
        instance: candidate.instance,
        version: Number(target()),
        nodes: Object.fromEntries(
          candidate.nodes.map((n) => [n.node, n.target ?? String(answers[`node:${n.node}`])]),
        ),
        comment: answers.comment,
      });
      toaster.success('迁好了');
      await preview();
    } catch (error) {
      showError(error);
    } finally {
      busy = false;
    }
  }

  const columns: DataTableColumn<MigrationCandidate>[] = [
    { key: 'title', header: '单据', minWidth: 180, cell: (c) => c.title ?? `#${c.instance}` },
    { key: 'version', header: '现在的版本', width: 100, cell: (c) => `第 ${c.version} 版` },
    { key: 'status', header: '状态', width: 90, cell: (c) => STATUS[c.status].label },
    {
      key: 'nodes',
      header: '正在的环节',
      minWidth: 200,
      cell: (c) =>
        c.nodes.map((n) => (n.target ? n.name : `${n.name}（新版本里没有）`)).join('、') || '—',
    },
    {
      key: 'ready',
      header: '',
      width: 120,
      cell: (c) =>
        c.ready ? (
          <Badge tone="success">能直接迁</Badge>
        ) : c.nodes.every((n) => n.target || n.choices.length > 0) ? (
          <Button size="sm" variant="outline" tone="neutral" onClick={() => void mapAndMigrate(c)}>
            对应节点
          </Button>
        ) : (
          <Badge tone="warning">没有能对应的</Badge>
        ),
    },
  ];

  return () => {
    const ready = (candidates ?? []).filter((c) => c.ready).length;
    return (
      <Card padding="md" header="迁移进行中的单子">
        <Flex direction="column" gap="md">
          <Flex gap="sm" align="end" wrap>
            <Field label="迁到">
              <Select
                items={versions.map((v) => ({
                  value: String(v.version),
                  label: `第 ${v.version} 版`,
                }))}
                _value={target()}
                onUpdate:_value={(value: string | null) => (picked = value)}
              />
            </Field>
            <Button variant="outline" tone="neutral" onClick={() => void preview()}>
              预览
            </Button>
            {candidates && ready > 0 && (
              <Button loading={busy} onClick={() => void migrate()}>
                迁移能直接迁的 {ready} 张
              </Button>
            )}
          </Flex>
          {candidates &&
            (candidates.length === 0 ? (
              <Small tone="muted">没有在别的版本上、还没结束的单子。</Small>
            ) : (
              <DataTable
                aria-label="要迁移的单子"
                rows={candidates}
                columns={columns}
                getKey={(c) => String(c.instance)}
                density="compact"
              />
            ))}
        </Flex>
      </Card>
    );
  };
});
