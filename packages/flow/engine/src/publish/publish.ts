/**
 * 发布与版本：校验定义、清单与逻辑，编译流程工程，记版本；检查（不发布）；全部流程、列出版本、取源码、回滚、启停、迁移预览。
 */
import {
  processGraph,
  validateManifest,
  type FlowProject,
  type Problem,
  type ProcessDefinition,
  validateProcess,
} from '@zerodep-dev/flow-ts-model';
import type { Ref } from '@zerodep-dev/easy-query-ts';
import { FlowDefinition, FlowInstance, FlowWorkItem, type flowSchema } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { FLOW_CHANNEL } from '../core/channels.ts';
import { buildProject } from './project.ts';
import type { FlowLogic } from '../extensions.ts';
import type { TypeProblem } from '../types.ts';
import type { EngineCore } from '../core/context.ts';
import type { CatalogEntry, CheckResult, MigrationCandidate, PublishOptions } from '../views.ts';
import type { FlowEngine } from '../engine.ts';

/** 版本行 → 工程：只发布过定义的，工程里只有 process.json（去掉版本号） */
function projectOf(row: {
  readonly model: ProcessDefinition;
  readonly files: Record<string, string> | null;
}): FlowProject {
  if (row.files) return { files: row.files };
  const { version: _, ...definition } = row.model;
  return { files: { 'process.json': JSON.stringify(definition, null, 2) } };
}

/** 定义里 `logic.名字` 的引用要在 logic.ts 对应的那一类里有 */
function logicProblems(definition: ProcessDefinition, logic: FlowLogic | undefined) {
  const problems: Problem[] = [];
  const check = (kind: keyof FlowLogic, ref: unknown, path: string) => {
    if (typeof ref !== 'string' || !ref.startsWith('logic.')) return;
    const name = ref.slice(6);
    if (!logic?.[kind]?.[name])
      problems.push({
        severity: 'error',
        code: 'logic.missing',
        field: path,
        params: { kind, name },
      });
  };
  const walk = (value: unknown, path: string, node?: { readonly type?: unknown }) => {
    if (typeof value === 'string') {
      if (value.startsWith('fn.logic.')) check('functions', value.slice(3), path);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`, node));
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    const record = value as Record<string, unknown>;
    const here = 'type' in record ? (record as { type?: unknown }) : node;
    for (const [key, item] of Object.entries(record)) {
      const at = `${path}.${key}`;
      if (key === 'resolver') check('resolvers', item, at);
      else if (key === 'guards' && Array.isArray(item))
        item.forEach((guard, i) => check('guards', guard, `${at}[${i}]`));
      else if (key === 'action' && here?.type === 'service') check('actions', item, at);
      else walk(item, at, here);
    }
  };
  walk(definition, '$');
  return problems;
}

/** 发布与版本：装进引擎核心（core.publishing），别的模块经它调用 */
export function createPublishing(core: EngineCore) {
  const { options, db, now, logics } = core;

  /** 编译、链接、校验、类型检查：发布与检查（check）共用；编译出错照常抛 */
  async function inspect(input: ProcessDefinition | FlowProject) {
    const project = 'files' in input ? input : undefined;
    const built = project
      ? await buildProject(project, options.transform, options.modules)
      : undefined;
    const definition = built?.definition ?? (input as ProcessDefinition);
    const fieldTypes = options.extensions?.fieldTypes ?? {};
    const problems: Problem[] = [
      ...validateProcess(definition).filter((problem) => problem.severity === 'error'),
      ...logicProblems(definition, built?.linked.logic),
      // 内联的单据：清单自己合不合规（注册的字段类型算认得的）
      ...(definition.form?.manifest
        ? validateManifest(definition.form.manifest, {
            isFieldType: (type) => Object.hasOwn(fieldTypes, type),
          })
        : []),
    ];
    // 定义有错时不做类型检查（多半是一样的错，也省一次检查）
    const types: readonly TypeProblem[] =
      problems.length === 0 && project && options.checkTypes
        ? await options.checkTypes(project, options.modules ?? {})
        : [];
    return { project, built, definition, problems, types };
  }

  async function check(input: ProcessDefinition | FlowProject): Promise<CheckResult> {
    try {
      const { definition, problems, types } = await inspect(input);
      return { definition, problems, types, error: null };
    } catch (error) {
      if (!(error instanceof FlowError)) throw error;
      const field = typeof error.details['field'] === 'string' ? error.details['field'] : null;
      return {
        definition: null,
        problems: [],
        types: [],
        error: { message: error.message, field },
      };
    }
  }

  async function publish(
    input: ProcessDefinition | FlowProject,
    { actor, note }: PublishOptions = {},
  ): Promise<{ key: string; version: number }> {
    const { project, built, definition, problems, types } = await inspect(input);
    if (problems.length > 0) {
      throw new FlowError(
        'invalid-definition',
        `流程 ${definition.key} 有 ${problems.length} 处错误`,
        { problems },
      );
    }
    if (types.length > 0) {
      const [first] = types;
      throw new FlowError(
        'invalid-definition',
        `流程 ${definition.key} 有 ${types.length} 处类型错误，第一处：${first!.file}:${first!.line} ${first!.message}`,
        { types },
      );
    }
    return db.transaction(async (tx) => {
      // 同一个流程的发布串行：版本号不撞
      await tx.advisoryLock(`flow.publish:${definition.key}`);
      const latest = await tx
        .queryable(FlowDefinition)
        .where((d) => d.processKey.eq(definition.key))
        .orderBy((d) => d.version.desc())
        .first();
      const version = (latest?.version ?? 0) + 1;
      const id = Number(
        await tx
          .insert(FlowDefinition)
          .values({
            processKey: definition.key,
            version,
            name: definition.name,
            model: { ...definition, version },
            enabled: true,
            publishedBy: actor?.id ?? null,
            publishedAt: now(),
            note: note ?? null,
            files: project ? { ...project.files } : null,
            modules: built ? { ...built.modules } : null,
          })
          .returnId(),
      );
      logics.set(id, Promise.resolve(built?.linked.logic));
      await tx.notify(FLOW_CHANNEL, JSON.stringify({ process: definition.key }));
      return { key: definition.key, version };
    });
  }

  const versionColumns = (d: Ref<typeof flowSchema, 'FlowDefinition'>) => ({
    id: d.id,
    key: d.processKey,
    version: d.version,
    name: d.name,
    enabled: d.enabled,
    publishedBy: d.publishedBy,
    publishedAt: d.publishedAt,
    note: d.note,
  });

  const versions: FlowEngine['versions'] = {
    catalog: async () => {
      const rows = await db
        .queryable(FlowDefinition)
        .orderBy((d) => [d.processKey, d.version.desc()])
        .select(versionColumns)
        .toList();
      const entries = new Map<string, CatalogEntry>();
      for (const row of rows) {
        const entry = entries.get(row.key);
        if (!entry) entries.set(row.key, { ...row, versions: 1, startable: row.enabled });
        else
          entries.set(row.key, {
            ...entry,
            versions: entry.versions + 1,
            startable: entry.startable || row.enabled,
          });
      }
      return [...entries.values()];
    },
    list: async (key) =>
      (
        await db
          .queryable(FlowDefinition)
          .where((d) => d.processKey.eq(key))
          .orderBy((d) => d.version.desc())
          .select(versionColumns)
          .toList()
      ).map(({ key: _key, ...info }) => info),
    project: async (key, version) => projectOf(await versionRow(key, version)),
    rollback: async (key, version, rest) =>
      publish(projectOf(await versionRow(key, version)), {
        ...rest,
        note: `回滚到第 ${version} 版`,
      }),
    migrationPreview: async (key, version) => {
      const target = processGraph((await versionRow(key, version)).model);
      const instances = await db
        .queryable(FlowInstance)
        .where((i) => [
          i.processKey.eq(key),
          i.version.ne(version),
          i.status.in(['active', 'suspended']),
        ])
        .orderBy((i) => i.id)
        .toList();
      const live = instances.length
        ? await db
            .queryable(FlowWorkItem)
            .where((w) => [
              w.instanceId.in(instances.map((i) => i.id)),
              w.state.in(['open', 'waiting']),
            ])
            .select((w) => ({ instanceId: w.instanceId, node: w.node }))
            .toList()
        : [];
      const candidates: MigrationCandidate[] = [];
      for (const instance of instances) {
        const from = processGraph(await core.definitionOf(db, instance.definitionId));
        // 同 migrate 命令：正在处理的节点与开着的待办所在的节点
        const inUse = new Set([
          ...instance.current,
          ...live.filter((w) => w.instanceId === instance.id).map((w) => w.node),
        ]);
        const nodes = [...inUse].map((node) => {
          const before = from.node(node);
          const after = target.node(node);
          return {
            node,
            name: before?.name ?? node,
            target: before && after && before.type === after.type ? node : null,
            // 手动对应时能选的：目标版本里同类型的节点（migrate 命令的 nodes 照此核对）
            choices: target.definition.nodes
              .filter((n) => n.type === before?.type)
              .map((n) => ({ node: n.id, name: n.name ?? n.id })),
          };
        });
        candidates.push({
          instance: instance.id,
          title: instance.title,
          status: instance.status,
          version: instance.version,
          nodes,
          ready: nodes.every((n) => n.target !== null),
        });
      }
      return candidates;
    },
    setEnabled: async (key, enabled) => {
      const latest = await versionRow(key);
      await db.notify(FLOW_CHANNEL, JSON.stringify({ process: key }));
      await db
        .update(FlowDefinition)
        .set({ enabled: false })
        .where((d) => d.processKey.eq(key))
        .execute();
      if (enabled)
        await db
          .update(FlowDefinition)
          .set({ enabled: true })
          .where((d) => d.id.eq(latest.id))
          .execute();
    },
  };

  async function versionRow(key: string, version?: number) {
    const row = await db
      .queryable(FlowDefinition)
      .where((d) => [
        d.processKey.eq(key),
        ...(version === undefined ? [] : [d.version.eq(version)]),
      ])
      .orderBy((d) => d.version.desc())
      .first();
    if (!row) {
      throw new FlowError(
        'not-found',
        `没有流程 ${key}${version === undefined ? '' : ` 的第 ${version} 版`}`,
      );
    }
    return row;
  }

  return { publish, check, versions, versionRow };
}

/** createPublishing 给出的函数 */
export type Publishing = ReturnType<typeof createPublishing>;
