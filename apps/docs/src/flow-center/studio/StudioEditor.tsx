/**
 * 流程工作室的编辑页（只给管理员）：工作副本是工程的文件。
 * - 图：设计器改 process.json；代码：文件树 + 编辑器，直接改各个文件（form.ts、logic.ts……）；版本：载入某一版、回滚。
 * - 边改边查：停手半秒后把整份文件交给 Worker 里的引擎检查（编译、校验、类型检查，同发布），问题列在下面，点一下定位。
 * - 发布：检查没有错误才能发，写发布说明，成新的一版；进行中的单子按原来的版本走完。
 * 还没发布过的新流程（从列表新建）只在这个页面里，发布后才进库。
 */
import { ArrowLeft, FilePlus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { CheckResult, VersionInfo } from '@zerodep-dev/flow-ts-engine';
import { FlowError } from '@zerodep-dev/flow-ts-engine/client';
import { problemMessage, type ProcessDefinition, type Problem } from '@zerodep-dev/flow-ts-model';
import {
  Alert,
  Badge,
  Button,
  Card,
  Flex,
  H2,
  ItemList,
  ItemListItem,
  LinkButton,
  SkeletonText,
  Small,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  useConfirm,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { CodeEditor } from '@zerodep-dev/vue-tsx-pro-ui/code-editor';
import { useFormDialog } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { onScopeDispose, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { timeText, who } from '../parts/labels';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';
import { ProcessCanvas } from './ProcessCanvas';
import {
  definitionOf,
  fileTemplate,
  PROCESS_FILE,
  sortedPaths,
  starterProject,
  stringify,
  type StarterId,
} from './project';

type Files = Readonly<Record<string, string>>;

const styles = css.create({
  code: {
    display: 'grid',
    gap: '_md',
    gridTemplateColumns: { default: '1fr', '@media (min-width: 64rem)': '14rem minmax(0, 1fr)' },
  },
  editor: { height: '32rem' },
});

/** 检查等多久：停手半秒再查，打字时不一直编译 */
const CHECK_DELAY = 500;

export default _component(() => {
  const center = useFlowCenter();
  const route = useRoute();
  const router = useRouter();
  const prompt = useFormDialog();
  const confirm = useConfirm();
  const key = String(route.params['key']);

  let files = _state.raw<Files | null>(null);
  /** 最新发布的那一版的文件（看有没有改动）；新流程是 null */
  let published = _state.raw<Files | null>(null);
  let versions = _state.raw<readonly VersionInfo[]>([]);
  let processes = _state.raw<readonly { value: string; label: string }[]>([]);
  let failed = _state('');
  let tab = _state('design');
  let active = _state(PROCESS_FILE);
  let code = _state('');
  let checked = _state.raw<CheckResult | null>(null);
  let checking = _state(false);
  let publishing = _state(false);
  let focus = _state.raw<{ node: string } | null>(null);

  async function load() {
    try {
      const [project, list, all] = await Promise.all([
        center.client.versions.project(key).catch((error: unknown) => {
          if (error instanceof FlowError && error.code === 'not-found') return null;
          throw error;
        }),
        center.client.versions.list(key).catch(() => []),
        center.client.processes(),
      ]);
      processes = all.filter((p) => p.key !== key).map((p) => ({ value: p.key, label: p.name }));
      versions = list;
      if (project) {
        published = project.files;
        files ??= project.files;
      } else if (!files) {
        const starter = (route.query['starter'] as StarterId | undefined) ?? 'blank';
        files = starterProject(starter, key, String(route.query['name'] ?? key)).files;
      }
      failed = '';
    } catch (error) {
      failed = error instanceof Error ? error.message : String(error);
    }
  }
  void load();

  // 改了就查：停手 CHECK_DELAY 再交给引擎；后一次覆盖前一次的结果
  let timer: ReturnType<typeof setTimeout> | undefined;
  let round = 0;
  watch(
    () => files,
    (current) => {
      clearTimeout(timer);
      if (!current) return;
      timer = setTimeout(() => {
        const mine = ++round;
        checking = true;
        void center.client
          .check({ files: current })
          .then((result) => {
            if (mine === round) checked = result;
          })
          .catch(showError)
          .finally(() => mine === round && (checking = false));
      }, CHECK_DELAY);
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(timer));

  // 代码页：换文件时把内容放进编辑器，改了写回工作副本
  watch(
    () => [active, files === null] as const,
    () => (code = files?.[active] ?? ''),
    { immediate: true },
  );
  watch(
    () => code,
    (text) => {
      if (files && files[active] !== undefined && files[active] !== text)
        files = { ...files, [active]: text };
    },
  );

  const definition = (): ProcessDefinition | undefined => (files ? definitionOf(files) : undefined);
  const dirty = () => !published || JSON.stringify(published) !== JSON.stringify(files);
  const errors = (): number =>
    !checked
      ? 0
      : (checked.error ? 1 : 0) +
        checked.problems.filter((p) => p.severity === 'error').length +
        checked.types.length;

  function setDefinition(next: ProcessDefinition) {
    if (files) files = { ...files, [PROCESS_FILE]: stringify(next) };
  }

  /** 问题说成业务的话；不认得的（logic 引用、清单的）写代号与位置 */
  function describe(problem: Problem): string {
    const current = checked?.definition ?? definition();
    try {
      if (current) return problemMessage(problem, current);
    } catch {
      // 说不了的照下面写
    }
    return [problem.code, problem.node ?? problem.field].filter(Boolean).join(' · ');
  }

  /** 定位到环节：问题带着节点，或字段路径落在某个节点里（`$.nodes[3].outcomes[0]…`） */
  function locate(problem: Problem) {
    const index = /^\$\.nodes\[(\d+)\]/.exec(problem.field ?? '')?.[1];
    const node =
      problem.node ?? (index === undefined ? undefined : definition()?.nodes[Number(index)]?.id);
    if (!node) return;
    tab = 'design';
    focus = { node };
  }

  function openFile(path: string) {
    active = path;
    tab = 'code';
  }

  async function addFile() {
    const answers = await prompt({
      title: '新文件',
      fields: [
        {
          name: 'path',
          label: '路径',
          required: true,
          placeholder: 'form.ts、logic.ts、rules/limits.ts',
          validate: (value) =>
            !/^[\w-]+(\/[\w-]+)*\.(ts|tsx|json)$/.test(value)
              ? '写相对路径，以 .ts、.tsx 或 .json 结尾'
              : files && value in files
                ? '已经有这个文件了'
                : null,
        },
      ],
      confirmText: '新建',
    });
    if (!answers || !files) return;
    files = { ...files, [answers.path]: fileTemplate(answers.path) };
    openFile(answers.path);
  }

  async function removeFile(path: string) {
    if (
      !files ||
      !(await confirm({ title: `删掉 ${path}？`, tone: 'danger', confirmText: '删除' }))
    )
      return;
    const { [path]: _, ...rest } = files;
    files = rest;
    if (active === path) active = PROCESS_FILE;
  }

  async function publish() {
    if (!files) return;
    const answers = await prompt({
      title: published ? `发布第 ${(versions[0]?.version ?? 0) + 1} 版` : '发布',
      description: '发布后这一版不再改；进行中的单子按原来的版本走完。',
      fields: [{ name: 'note', label: '发布说明', type: 'textarea', placeholder: '改了什么' }],
      confirmText: '发布',
    });
    if (!answers) return;
    publishing = true;
    try {
      const { version } = await center.client.publish({ files }, answers.note || undefined);
      toaster.success(`已发布第 ${version} 版`);
      published = files;
      if (route.query['starter']) void router.replace({ query: {} });
      await load();
    } catch (error) {
      showError(error);
    } finally {
      publishing = false;
    }
  }

  async function loadVersion(info: VersionInfo) {
    if (
      dirty() &&
      !(await confirm({
        title: '放弃现在的改动？',
        description: `换成第 ${info.version} 版的文件。`,
        confirmText: '换',
      }))
    )
      return;
    try {
      files = (await center.client.versions.project(key, info.version)).files;
      tab = 'design';
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
      const { version } = await center.client.versions.rollback(key, info.version);
      toaster.success(`已回滚：现在是第 ${version} 版`);
      files = null;
      await load();
    } catch (error) {
      showError(error);
    }
  }

  function renderProblems() {
    if (!checked) return checking ? <SkeletonText lines={1} /> : null;
    const { error, problems, types } = checked;
    if (error)
      return (
        <Alert
          tone="danger"
          title={error.field ? `${error.field} 编译不过` : '编译不过'}
          description={error.message}
          action={
            error.field && (
              <Button size="sm" variant="soft" tone="danger" onClick={() => openFile(error.field!)}>
                去改
              </Button>
            )
          }
        />
      );
    const listed = problems.filter((p) => p.severity === 'error');
    if (listed.length === 0 && types.length === 0)
      return <Alert tone="success" description={checking ? '检查中…' : '检查通过，可以发布。'} />;
    return (
      <Alert tone="danger" title={`还有 ${listed.length + types.length} 个问题要处理`}>
        <ItemList density="compact">
          {listed.map((problem, index) => (
            <ItemListItem
              key={`p${index}`}
              title={describe(problem)}
              onSelect={() => locate(problem)}
            />
          ))}
          {types.map((type, index) => (
            <ItemListItem
              key={`t${index}`}
              title={`${type.file}:${type.line} ${type.message}`}
              onSelect={() => openFile(type.file)}
            />
          ))}
        </ItemList>
      </Alert>
    );
  }

  function renderCode(current: Files) {
    return (
      <div {...css.attrs(styles.code)}>
        <Card
          padding="sm"
          header="文件"
          extra={
            <Button
              size="sm"
              variant="ghost"
              tone="neutral"
              icon={FilePlus}
              onClick={() => void addFile()}
            >
              新文件
            </Button>
          }
        >
          <ItemList aria-label="文件" density="compact">
            {sortedPaths(current).map((path) => (
              <ItemListItem
                key={path}
                title={path}
                selected={path === active}
                onSelect={() => (active = path)}
                end={
                  path !== PROCESS_FILE && (
                    <Button
                      size="sm"
                      variant="ghost"
                      tone="neutral"
                      icon={Trash2}
                      aria-label={`删掉 ${path}`}
                      onClick={(event: MouseEvent) => {
                        event.stopPropagation();
                        void removeFile(path);
                      }}
                    />
                  )
                }
              />
            ))}
          </ItemList>
        </Card>
        <CodeEditor key={active} _value={code} aria-label={active} sx={styles.editor} />
      </div>
    );
  }

  function renderVersions() {
    if (versions.length === 0) return <Small tone="muted">还没发布过。</Small>;
    return (
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
                  onClick={() => void loadVersion(info)}
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
    );
  }

  return () => {
    if (!center.admin())
      return (
        <Alert
          tone="warning"
          title="只有管理员能用工作室"
          description="顶栏把演示身份换成顾承远（总经理）。"
        />
      );
    if (failed) return <Alert tone="danger" title="打不开这个流程" description={failed} />;
    const current = files;
    if (!current) return <SkeletonText lines={8} />;
    const graph = definition();
    return (
      <Flex direction="column" gap="lg">
        <Flex align="center" justify="between" gap="md" wrap>
          <Flex align="center" gap="sm" wrap>
            <LinkButton
              href="/flow/studio"
              size="sm"
              variant="ghost"
              tone="neutral"
              icon={ArrowLeft}
              aria-label="回到流程列表"
            />
            <H2>{graph?.name ?? key}</H2>
            {versions[0] ? (
              <Badge tone="neutral">第 {versions[0].version} 版</Badge>
            ) : (
              <Badge tone="warning">未发布</Badge>
            )}
            {published && dirty() && <Badge tone="accent">有改动</Badge>}
          </Flex>
          <Flex gap="sm">
            {published && dirty() && (
              <Button variant="ghost" tone="neutral" onClick={() => (files = published)}>
                放弃改动
              </Button>
            )}
            <Button
              loading={publishing}
              disabled={!dirty() || checking || !checked || errors() > 0}
              onClick={() => void publish()}
            >
              发布
            </Button>
          </Flex>
        </Flex>
        <Tabs _value={tab}>
          <TabList aria-label="编辑">
            <Tab value="design">图</Tab>
            <Tab value="code">代码</Tab>
            <Tab value="versions">版本</Tab>
          </TabList>
          <TabPanel value="design">
            {graph ? (
              <ProcessCanvas
                definition={graph}
                processes={processes}
                focus={focus}
                onChange={setDefinition}
              />
            ) : (
              <Alert
                tone="danger"
                title="process.json 写坏了"
                description="图读不出来：到“代码”里把它改对。"
                action={
                  <Button
                    size="sm"
                    variant="soft"
                    tone="danger"
                    onClick={() => openFile(PROCESS_FILE)}
                  >
                    去改
                  </Button>
                }
              />
            )}
          </TabPanel>
          <TabPanel value="code">{renderCode(current)}</TabPanel>
          <TabPanel value="versions">{renderVersions()}</TabPanel>
        </Tabs>
        {renderProblems()}
      </Flex>
    );
  };
});
