/**
 * 发布与版本：校验定义、清单与逻辑，编译流程工程，记版本；列出版本、取源码、回滚。
 */
import {
  validateManifest,
  type FlowProject,
  type Problem,
  type ProcessDefinition,
  validateProcess,
} from '@zerodep-dev/flow-ts-model';
import { FlowDefinition } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { buildProject, type FlowLogic } from './project.ts';
import type { TypeProblem } from '../types.ts';
import type { EngineCore } from '../core/context.ts';
import type { PublishOptions } from '../views.ts';
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

  async function publish(
    input: ProcessDefinition | FlowProject,
    { actor, note }: PublishOptions = {},
  ): Promise<{ key: string; version: number }> {
    const project = 'files' in input ? input : undefined;
    const built = project
      ? await buildProject(project, options.transform, options.modules)
      : undefined;
    const definition = built?.definition ?? (input as ProcessDefinition);
    const fieldTypes = options.extensions?.fieldTypes ?? {};
    const problems = [
      ...validateProcess(definition).filter((problem) => problem.severity === 'error'),
      ...logicProblems(definition, built?.linked.logic),
      // 内联的单据：清单自己合不合规（注册的字段类型算认得的）
      ...(definition.form?.manifest
        ? validateManifest(definition.form.manifest, {
            isFieldType: (type) => Object.hasOwn(fieldTypes, type),
          })
        : []),
    ];
    if (problems.length > 0) {
      throw new FlowError(
        'invalid-definition',
        `流程 ${definition.key} 有 ${problems.length} 处错误`,
        { problems },
      );
    }
    const types: readonly TypeProblem[] =
      project && options.checkTypes ? await options.checkTypes(project, options.modules ?? {}) : [];
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
      return { key: definition.key, version };
    });
  }

  const versions: FlowEngine['versions'] = {
    list: (key) =>
      db
        .queryable(FlowDefinition)
        .where((d) => d.processKey.eq(key))
        .orderBy((d) => d.version.desc())
        .select((d) => ({
          id: d.id,
          version: d.version,
          name: d.name,
          enabled: d.enabled,
          publishedBy: d.publishedBy,
          publishedAt: d.publishedAt,
          note: d.note,
        }))
        .toList(),
    project: async (key, version) => projectOf(await versionRow(key, version)),
    rollback: async (key, version, rest) =>
      publish(projectOf(await versionRow(key, version)), {
        ...rest,
        note: `回滚到第 ${version} 版`,
      }),
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

  return { publish, versions, versionRow };
}

/** createPublishing 给出的函数 */
export type Publishing = ReturnType<typeof createPublishing>;
