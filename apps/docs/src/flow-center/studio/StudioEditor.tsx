/**
 * 流程工作室的编辑页（只给管理员）：工作副本是工程的文件。
 * - 图：设计器改 process.json；单据：表单设计器改字段清单（有 form.ts 时重写它，没有时改 process.json 里内联的清单）；
 *   测试：跑 test.ts 的场景（TestsPanel）；代码：文件树 + 编辑器，直接改各个文件（form.ts、logic.ts……），TS 文件有浏览器里的 TypeScript 7 语言服务（lsp/）；试运行：拿工作副本一步步走（TrialRun）；
 *   版本：和工作副本对比、载入某一版、回滚、迁移进行中的单子（VersionsPanel）。
 * - 边改边查：停手半秒后把整份文件交给 Worker 里的引擎检查（编译、校验、类型检查，同发布），问题列在下面，点一下定位。
 * - 发布：检查没有错误才能发，写发布说明，成新的一版；进行中的单子按原来的版本走完。
 * 还没发布过的新流程（从列表新建）只在这个页面里，发布后才进库。
 */
import { ArrowLeft, FilePlus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { CheckResult, VersionInfo } from '@zerodep-dev/flow-ts-engine';
import { FlowError } from '@zerodep-dev/flow-ts-engine/client';
import {
  formFileSource,
  problemMessage,
  type FormManifest,
  type ProcessDefinition,
  type Problem,
} from '@zerodep-dev/flow-ts-model';
import { FormDesigner } from '@zerodep-dev/flow-ts-ui';
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
import { javascript } from '@codemirror/lang-javascript';
import { useFormDialog } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { onScopeDispose, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';
import { ProcessCanvas } from './ProcessCanvas';
import { TestsPanel } from './TestsPanel';
import { TrialRun } from './TrialRun';
import { languageServicePlugin, lspState, syncLanguageService } from './lsp/client';
import { VersionsPanel } from './VersionsPanel';
import {
  definitionOf,
  fileTemplate,
  PROCESS_FILE,
  TEST_FILE,
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
  /** 表单设计器刚改的清单：重写的 form.ts 检查完之前先显示它（不然要等编译才看得到改动） */
  let formDraft = _state.raw<FormManifest | null>(null);
  /** 版本页里正在和工作副本比的那一版 */

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
            if (mine !== round) return;
            checked = result;
            formDraft = null;
          })
          .catch(showError)
          .finally(() => mine === round && (checking = false));
      }, CHECK_DELAY);
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(timer));

  // 代码页签里的语言服务：打开过代码页签后，工程的文件改了就同步过去（它据此报错、补全跨文件的东西）
  let lspTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => [files, tab] as const,
    ([current, now]) => {
      clearTimeout(lspTimer);
      if (!current || now !== 'code') return;
      lspTimer = setTimeout(() => syncLanguageService(current), 300);
    },
  );
  onScopeDispose(() => clearTimeout(lspTimer));

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

  /** 单据的清单：form.ts 编译出来的（检查结果里），或 process.json 里内联的 */
  function manifest(): FormManifest | undefined {
    if (formDraft) return formDraft;
    if (files?.['form.ts'] !== undefined) return checked?.definition?.form?.manifest;
    return definition()?.form?.manifest;
  }

  function setManifest(next: FormManifest) {
    if (!files) return;
    formDraft = next;
    if (files['form.ts'] !== undefined) {
      files = { ...files, 'form.ts': formFileSource(next) };
      return;
    }
    const current = definition();
    if (current)
      setDefinition({
        ...current,
        form: { ...current.form, key: current.form?.key ?? key, manifest: next },
      });
  }

  function renderForm(current: Files) {
    const fields = manifest();
    if (current['form.ts'] === undefined && !definition()?.form?.manifest)
      return (
        <Alert
          tone="info"
          title="这个流程还没有单据"
          description="加一个 form.ts：字段清单，推出单据的类型给 logic.ts 用。"
          action={
            <Button
              size="sm"
              onClick={() => (files = { ...current, 'form.ts': fileTemplate('form.ts') })}
            >
              加 form.ts
            </Button>
          }
        />
      );
    if (!fields)
      return checked?.error ? (
        <Alert
          tone="danger"
          title="form.ts 编译不过"
          description="先到“代码”里改对，这里才读得出字段。"
        />
      ) : (
        <SkeletonText lines={4} />
      );
    return (
      <Flex direction="column" gap="sm">
        {current['form.ts'] !== undefined && (
          <Small tone="muted">
            改动会重写 form.ts：清单照原样写回，form.ts 里手写的注释、别的代码不保留。
          </Small>
        )}
        <FormDesigner manifest={fields} onChange={setManifest} sources={['suppliers']} />
      </Flex>
    );
  }

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
          <Small tone={lspState.status === 'error' ? 'danger' : 'muted'}>
            {lspState.status === 'ready'
              ? `语言服务：TypeScript 7（${lspState.build}）`
              : lspState.status === 'error'
                ? `语言服务没起来：${lspState.message}`
                : '语言服务加载中（约 12MB，只在第一次）…'}
          </Small>
        </Card>
        <CodeEditor
          key={active}
          _value={code}
          language={[javascript({ jsx: true, typescript: true }), languageServicePlugin(active)]}
          aria-label={active}
          sx={styles.editor}
        />
      </div>
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
            <Tab value="form">单据</Tab>
            <Tab value="code">代码</Tab>
            <Tab value="trial">试运行</Tab>
            <Tab value="tests">测试</Tab>
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
          <TabPanel value="form">{renderForm(current)}</TabPanel>
          <TabPanel value="code">{renderCode(current)}</TabPanel>
          <TabPanel value="trial">
            {graph && (
              <TrialRun
                files={current}
                definition={checked?.definition ?? graph}
                manifest={manifest()}
              />
            )}
          </TabPanel>
          <TabPanel value="tests">
            <TestsPanel
              files={current}
              onCreate={() => {
                files = { ...current, [TEST_FILE]: fileTemplate(TEST_FILE) };
                openFile(TEST_FILE);
              }}
            />
          </TabPanel>
          <TabPanel value="versions">
            <VersionsPanel
              processKey={key}
              versions={versions}
              files={current}
              dirty={dirty()}
              onLoad={(loaded) => {
                files = loaded;
                tab = 'design';
              }}
              onRollback={() => {
                files = null;
                void load();
              }}
            />
          </TabPanel>
        </Tabs>
        {renderProblems()}
      </Flex>
    );
  };
});
