/**
 * 把进行中的单子迁到某一版（工作室的“版本”页签里）：先预览——每张单正在用的节点在那一版里有没有同名同类型的节点，
 * 对应得上的一键迁移（写原因，逐张成败），对应不上的列出来是哪个节点（改图时保留那个节点，或让单子按原版本走完）。
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
  let target = _state<string | null>(versions[0] ? String(versions[0].version) : null);
  let candidates = _state.raw<readonly MigrationCandidate[] | null>(null);
  let busy = _state(false);

  async function preview() {
    if (!target) return;
    try {
      candidates = await center.client.versions.migrationPreview(processKey, Number(target));
    } catch (error) {
      showError(error);
    }
  }

  async function migrate() {
    const ready = (candidates ?? []).filter((c) => c.ready);
    const answers = await prompt({
      title: `把 ${ready.length} 张单迁到第 ${target} 版？`,
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
          version: Number(target),
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
      width: 100,
      cell: (c) =>
        c.ready ? <Badge tone="success">能直接迁</Badge> : <Badge tone="warning">对应不上</Badge>,
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
                _value={target}
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
