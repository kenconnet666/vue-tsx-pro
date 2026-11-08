/**
 * 发起：建实例并从开始节点走起（发起与调用流程共用 launch），发起前的草稿（drafts），发起时单据的值按清单收与查。
 */
import { type Row } from '@zerodep-dev/easy-query-ts';
import {
  fieldStates,
  isRef,
  formManifest,
  type AssigneeSource,
  type ProcessDefinition,
  plainValue,
} from '@zerodep-dev/flow-ts-model';
import { checkPicks, nextSteps, picksOf, type Picks } from '../runtime/next-steps.ts';
import { FlowDefinition, FlowInstance, type FlowDb } from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { Execution, renderTitle, workItemSummary, type InstanceRow } from '../runtime/execution.ts';
import { emptyRunState } from '../runtime/state.ts';
import type { Actor, FlowCommand, RunResult } from '../types.ts';
import type { EngineCore } from '../core/context.ts';
import { submit, throwFormErrors } from './submission.ts';
import { predictScope } from '../runtime/next-steps.ts';
import type { FlowEngine } from '../engine.ts';

/** 定义里写的变量名：`form.字段` 就是流程变量里的“字段” */
export const variableName = (name: string): string =>
  name.startsWith('form.') ? name.slice(5) : name;

/** 定义里直接写的编号（引用在发起前取不到值） */
const literal = (value: unknown): string | undefined =>
  isRef(value) ? undefined : String(value as string | number);

/** 能不能发起：发起人名单里的人、角色、部门 */
export function canStart(starters: readonly AssigneeSource[], actor: Actor): boolean {
  return starters.some((source) => {
    if ('user' in source) return literal(source.user) === actor.id;
    if ('role' in source) return actor.roles?.includes(literal(source.role) ?? '') ?? false;
    if ('department' in source) {
      return actor.departments?.includes(literal(source.department) ?? '') ?? false;
    }
    return false;
  });
}

/** 变量声明里的默认值 */
export function defaultsOf(definition: ProcessDefinition): Record<string, unknown> {
  return Object.fromEntries(
    (definition.variables ?? [])
      .filter((v) => v.default !== undefined)
      .map((v) => [v.name, v.default]),
  );
}

/** 发起：装进引擎核心（core.starts），别的模块经它调用 */
export function createStarts(core: EngineCore) {
  const { options, db, now, execution, latestDefinition } = core;

  /** 建一个实例并从开始节点走起（发起与调用流程共用），返回推进现场（还没写回） */
  async function launch(
    tx: FlowDb,
    definition: Row<typeof FlowDefinition>,
    variables: Readonly<Record<string, unknown>>,
    actor: Actor,
    extra: Pick<InstanceRow, 'businessKey' | 'title' | 'parentId' | 'parentNode' | 'parentRound'>,
    /** 从草稿发起：用草稿那一行（同一个实例） */
    draftId?: number,
    /** 发起人给下一步选的处理人；null 时不查（调用流程发起的子实例没有人选） */
    picks: Picks | null = null,
  ): Promise<Execution> {
    const model = definition.model;
    const values = {
      definitionId: definition.id,
      processKey: model.key,
      version: definition.version,
      status: 'active' as const,
      result: null,
      current: [],
      variables: { ...defaultsOf(model), ...variables },
      state: emptyRunState(),
      startedBy: actor.id,
      startedAt: now(),
      endedAt: null,
      rev: 0,
      ...extra,
    };
    const id = draftId ?? Number(await tx.insert(FlowInstance).values(values).returnId());
    if (draftId !== undefined)
      await tx
        .update(FlowInstance)
        .set(values)
        .where((i) => i.id.eq(draftId))
        .execute();
    const exec = await execution(tx, model, { id, ...values }, actor);
    exec.addEvent(
      'instance.started',
      extra.parentId === null
        ? {}
        : { data: { parentId: extra.parentId, parentNode: extra.parentNode } },
    );
    const startNode = model.nodes.find((node) => node.type === 'start');
    if (!startNode) throw new FlowError('invalid-definition', `流程 ${model.key} 没有开始节点`);
    exec.lastHandler = actor.id;
    if (picks !== null)
      exec.state.picks = checkPicks(
        picksOf(
          await nextSteps(predictScope(options, exec, actor.id), startNode.id, { read: exec.read }),
        ),
        picks,
      );
    await exec.enter(startNode.id, 'start');
    return exec;
  }

  async function start(
    command: Extract<FlowCommand, { type: 'start' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return db.transaction(async (tx) => {
      const draft =
        command.draft === undefined ? undefined : await ownDraft(tx, command.draft, actor);
      const definition = await latestDefinition(tx, draft?.processKey ?? command.process);
      if (definition.model.starters && !canStart(definition.model.starters, actor)) {
        throw new FlowError('forbidden', `${actor.id} 不能发起 ${command.process}`);
      }
      const submitted = { ...(draft?.variables ?? {}), ...(command.variables ?? {}) };
      const variables = startValues(definition.model, submitted, { required: true });
      const exec = await launch(
        tx,
        definition,
        variables,
        actor,
        {
          businessKey: command.businessKey ?? draft?.businessKey ?? null,
          title: command.title ?? null,
          parentId: null,
          parentNode: null,
          parentRound: null,
        },
        draft?.id,
        command.picks ?? {},
      );
      const { instance, events } = await exec.flush();
      const result = { instance, workItems: exec.created.map(workItemSummary), events };
      await options.intercept?.after?.(command, result, actor);
      return result;
    });
  }

  /** 发起时的值：按发起节点的权限收（只取能改的、显示条件不成立的丢掉），查值；required 时查必填。清单以外的变量原样留着 */
  function startValues(
    model: ProcessDefinition,
    submitted: Readonly<Record<string, unknown>>,
    { required }: { readonly required: boolean },
  ): Record<string, unknown> {
    const manifest = formManifest(model);
    // 强类型的值先写成文字：存的是普通 JSON，校验时再按清单读成强类型
    submitted = plainValue(submitted) as Readonly<Record<string, unknown>>;
    if (Object.keys(manifest).length === 0) return { ...submitted };
    const start = model.nodes.find((node) => node.type === 'start');
    const stored = defaultsOf(model);
    const read = (name: string) => {
      const key = variableName(name);
      return key in submitted ? submitted[key] : stored[key];
    };
    const states = fieldStates(manifest, { access: start?.form, isStart: true, read });
    const { values, errors } = submit(
      manifest,
      states,
      stored,
      submitted,
      options.extensions?.fieldTypes,
    );
    throwFormErrors(manifest, required ? errors : errors.filter((e) => e.code !== 'required'));
    const others = Object.fromEntries(
      Object.entries(submitted).filter(([name]) => !(name in manifest)),
    );
    return { ...others, ...values };
  }

  /** 自己的草稿（别人的、不是草稿的都当没有） */
  async function ownDraft(tx: FlowDb, id: number, actor: Actor): Promise<InstanceRow> {
    const row = await tx.queryable(FlowInstance).find(id);
    if (!row || row.status !== 'draft' || row.startedBy !== actor.id)
      throw new FlowError('not-found', `没有草稿 ${id}`);
    return row;
  }

  const drafts: FlowEngine['drafts'] = {
    save: (input, actor) =>
      db.transaction(async (tx) => {
        const existing =
          input.draft === undefined ? undefined : await ownDraft(tx, input.draft, actor);
        const definition = await latestDefinition(tx, existing?.processKey ?? input.process ?? '');
        const model = definition.model;
        const variables = startValues(
          model,
          { ...(existing?.variables ?? {}), ...(input.variables ?? {}) },
          { required: false },
        );
        const title = renderTitle(model.title, (field) => variables[variableName(field)] ?? null);
        const values = {
          definitionId: definition.id,
          processKey: model.key,
          version: definition.version,
          businessKey: input.businessKey ?? existing?.businessKey ?? null,
          title,
          variables,
          startedAt: now(),
        };
        if (existing) {
          await tx
            .update(FlowInstance)
            .set(values)
            .where((i) => i.id.eq(existing.id))
            .execute();
          return { ...existing, ...values };
        }
        const row = {
          ...values,
          status: 'draft' as const,
          result: null,
          current: [],
          state: emptyRunState(),
          startedBy: actor.id,
          endedAt: null,
          parentId: null,
          parentNode: null,
          parentRound: null,
          rev: 0,
        };
        const id = Number(await tx.insert(FlowInstance).values(row).returnId());
        return { id, ...row };
      }),
    list: (actor) =>
      db
        .queryable(FlowInstance)
        .where((i) => [i.startedBy.eq(actor.id), i.status.eq('draft')])
        .orderBy((i) => i.id.desc())
        .toList(),
    get: (id, actor) => db.transaction((tx) => ownDraft(tx, id, actor)),
    discard: (id, actor) =>
      db.transaction(async (tx) => {
        await ownDraft(tx, id, actor);
        await tx
          .delete(FlowInstance)
          .where((i) => [i.id.eq(id), i.status.eq('draft')])
          .execute();
        return true;
      }),
  };

  return { launch, start, startValues, ownDraft, drafts };
}

/** createStarts 给出的函数 */
export type Starts = ReturnType<typeof createStarts>;
