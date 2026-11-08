/**
 * 发起页：按发起视图（startView）渲染单据，提交前就写出“提交后到哪、谁处理”；下一步要发起人选处理人时，提交时选。
 * 可以存草稿（不进流程，只有自己看得到），从工作台的草稿接着填（地址里的 draft）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { StartView } from '@zerodep-dev/flow-ts-engine';
import { fromFormValues, useFlowForm } from '@zerodep-dev/flow-ts-ui';
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  H1,
  SchemaFields,
  SkeletonText,
  Small,
} from '@zerodep-dev/vue-tsx-pro-ui';
import {
  ActionBar,
  useFormDialog,
  type FormDialogField,
} from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { getLocalTimeZone } from '@internationalized/date';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PEOPLE } from '../domain/org';
import { who } from '../parts/labels';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';

/** StartFormBody 的属性 */
interface StartFormBodyProps {
  view: StartView;
  /** 从草稿接着填：草稿的编号与值 */
  draftId: number | null;
  draftValues: Record<string, unknown> | null;
}

/** 发起的表单：视图取到之后才建（useFlowForm 在 setup 里取清单） */
const StartFormBody = _component(
  ({ view, draftId: initialDraft, draftValues }: StartFormBodyProps) => {
    const center = useFlowCenter();
    const router = useRouter();
    const prompt = useFormDialog();
    const timeZone = getLocalTimeZone();
    let busy = _state('');
    let draftId = initialDraft;

    const form = useFlowForm({
      manifest: view.manifest,
      access: view.access ?? undefined,
      isStart: true,
      values: draftValues ?? view.values,
      timeZone,
      onSubmit: (variables) => start(variables),
    });

    async function start(variables: Record<string, unknown>) {
      let chosen: Record<string, string[]> = {};
      if (view.picks.length > 0) {
        const fields: FormDialogField[] = view.picks.map((pick) => ({
          name: pick.node,
          label: `${pick.nodeName}由谁处理`,
          type: 'select',
          required: true,
          multiple: pick.max !== 1,
          options: (pick.candidates ?? PEOPLE.map((p) => p.id)).map((id) => ({
            value: id,
            label: who(id),
          })),
        }));
        const answers = await prompt({ title: '选下一步的处理人', fields, confirmText: '提交' });
        if (!answers) return;
        chosen = Object.fromEntries(
          Object.entries(answers).map(([node, value]) => [
            node,
            Array.isArray(value) ? value : [value],
          ]),
        );
      }
      busy = 'start';
      try {
        const result = await center.client.run({
          type: 'start',
          process: view.process.key,
          variables,
          ...(draftId !== null ? { draft: draftId } : {}),
          ...(view.picks.length > 0 ? { picks: chosen } : {}),
        });
        toaster.success('已提交');
        void router.push({
          path: '/flow/work',
          query: { box: 'started', instance: String(result.instance.id) },
        });
      } catch (error) {
        showError(error);
      } finally {
        busy = '';
      }
    }

    async function saveDraft() {
      busy = 'draft';
      try {
        const saved = await center.client.drafts.save({
          ...(draftId !== null ? { draft: draftId } : { process: view.process.key }),
          variables: fromFormValues(view.manifest, form.values, timeZone),
        });
        draftId = saved.id;
        toaster.success('草稿已存');
      } catch (error) {
        showError(error);
      } finally {
        busy = '';
      }
    }

    /** 提交后到哪：一句话 */
    const nextText = () =>
      view.next
        .map((step) =>
          step.type === 'end'
            ? `结束：${step.nodeName}`
            : step.pick
              ? `${step.nodeName}（提交时选处理人）`
              : step.inbox
                ? `${step.nodeName}（收件箱）`
                : `${step.nodeName}：${step.handlers.map(who).join('、') || '—'}`,
        )
        .join('；');

    return () => (
      <Flex direction="column" gap="md">
        <Form controller={form}>
          <SchemaFields controller={form} columns={2} />
        </Form>
        <ActionBar start={view.next.length > 0 && <Small tone="muted">提交后：{nextText()}</Small>}>
          <Button
            variant="ghost"
            tone="neutral"
            loading={busy === 'draft'}
            onClick={() => void saveDraft()}
          >
            存草稿
          </Button>
          <Button loading={busy === 'start'} onClick={() => void form.submit()}>
            提交
          </Button>
        </ActionBar>
      </Flex>
    );
  },
);

export default _component(() => {
  const center = useFlowCenter();
  const route = useRoute();
  let view = _state.raw<StartView | null>(null);
  let draft = _state.raw<Record<string, unknown> | null>(null);
  let failed = _state('');

  watch(
    () => [String(route.params['key']), route.query['draft'], center.state.actor] as const,
    async ([key, draftId]) => {
      try {
        view = await center.client.startView(key);
        draft = draftId ? (await center.client.drafts.get(Number(draftId))).variables : null;
        failed = '';
      } catch (error) {
        failed = error instanceof Error ? error.message : String(error);
      }
    },
    { immediate: true },
  );

  return () => (
    <Flex direction="column" gap="lg">
      {failed ? (
        <Alert tone="danger" title="打不开发起页" description={failed} />
      ) : !view ? (
        <SkeletonText lines={6} />
      ) : (
        <>
          <H1>{view.process.name}</H1>
          <Card padding="lg">
            <StartFormBody
              key={`${view.process.key}-${String(route.query['draft'] ?? '')}-${center.state.actor}`}
              view={view}
              draftId={route.query['draft'] ? Number(route.query['draft']) : null}
              draftValues={draft}
            />
          </Card>
        </>
      )}
    </Flex>
  );
});
