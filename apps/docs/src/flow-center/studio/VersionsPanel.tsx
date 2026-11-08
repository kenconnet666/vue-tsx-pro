/**
 * 工作室的“版本”页签：发布过的各版——和工作副本对比（VersionCompare：图的变化、逐行的代码差异）、载入成工作副本、
 * 回滚（把那一版原样发布成新的一版）；下面是把进行中的单子迁到某一版（MigrationPanel）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VersionInfo } from '@zerodep-dev/flow-ts-engine';
import {
  Button,
  Flex,
  ItemList,
  ItemListItem,
  Small,
  useConfirm,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { timeText, who } from '../parts/labels';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';
import { MigrationPanel } from './MigrationPanel';
import { VersionCompare } from './VersionCompare';

type Files = Readonly<Record<string, string>>;

/** VersionsPanel 的属性 */
export interface VersionsPanelProps {
  processKey: string;
  /** 新的在前 */
  versions: readonly VersionInfo[];
  /** 工作副本 */
  files: Files;
  /** 工作副本有没发布的改动：载入别的版本前先问 */
  dirty: boolean;
  /** 载入了某一版的文件 */
  onLoad: (files: Files) => void;
  /** 回滚成了新的一版：编辑页重新取 */
  onRollback: () => void;
}

export const VersionsPanel = _component(
  ({ processKey, versions, files, dirty, onLoad, onRollback }: VersionsPanelProps) => {
    const center = useFlowCenter();
    const confirm = useConfirm();
    /** 正在和工作副本比的那一版 */
    let comparing = _state.raw<{ label: string; files: Files } | null>(null);

    const projectOf = async (info: VersionInfo) =>
      (await center.client.versions.project(processKey, info.version)).files;

    async function compare(info: VersionInfo) {
      try {
        comparing = { label: `第 ${info.version} 版`, files: await projectOf(info) };
      } catch (error) {
        showError(error);
      }
    }

    async function load(info: VersionInfo) {
      if (
        dirty &&
        !(await confirm({
          title: '放弃现在的改动？',
          description: `换成第 ${info.version} 版的文件。`,
          confirmText: '换',
        }))
      )
        return;
      try {
        onLoad(await projectOf(info));
      } catch (error) {
        showError(error);
      }
    }

    async function rollback(info: VersionInfo) {
      const ok = await confirm({
        title: `回滚到第 ${info.version} 版？`,
        description: '把那一版原样发布成新的一版；进行中的单子不受影响。',
        confirmText: '回滚',
      });
      if (!ok) return;
      try {
        const { version } = await center.client.versions.rollback(processKey, info.version);
        toaster.success(`已回滚：现在是第 ${version} 版`);
        onRollback();
      } catch (error) {
        showError(error);
      }
    }

    return () => {
      if (versions.length === 0) return <Small tone="muted">还没发布过。</Small>;
      return (
        <Flex direction="column" gap="lg">
          <ItemList aria-label="版本">
            {versions.map((info) => (
              <ItemListItem
                key={info.version}
                title={`第 ${info.version} 版${info.note ? ` · ${info.note}` : ''}`}
                description={`${info.publishedBy ? who(info.publishedBy) : '系统'} · ${timeText(info.publishedAt, center.state.now)}${info.enabled ? ' · 能发起' : ''}`}
                end={
                  <Flex gap="xs">
                    <Button
                      size="sm"
                      variant="ghost"
                      tone="neutral"
                      onClick={() => void compare(info)}
                    >
                      和现在比
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      tone="neutral"
                      onClick={() => void load(info)}
                    >
                      载入
                    </Button>
                    {info.version !== versions[0]?.version && (
                      <Button
                        size="sm"
                        variant="outline"
                        tone="neutral"
                        onClick={() => void rollback(info)}
                      >
                        回滚到这版
                      </Button>
                    )}
                  </Flex>
                }
              />
            ))}
          </ItemList>
          {comparing && (
            <VersionCompare before={comparing.files} after={files} label={comparing.label} />
          )}
          <MigrationPanel processKey={processKey} versions={versions} />
        </Flex>
      );
    };
  },
);
