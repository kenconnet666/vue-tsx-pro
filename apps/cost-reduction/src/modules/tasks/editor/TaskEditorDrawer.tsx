/**
 * 新建、编辑任务卡的抽屉：从右侧滑入，页面留在原处（台账、详情都用它）。target 是 'new:unit'、'new:dmc'
 * 或任务编号，空字符串是关着；页面把它放在地址的查询参数里（?editor=…），刷新、分享都还打开着。
 * 宽度可以拖动（能拖到几乎关上，让出后面的台账）、各人记住；有未保存的改动时，关闭按钮、Esc、点遮罩、取消都先确认；保存后关上并通知页面刷新
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Drawer, useConfirm, usePersistentState, useRequest } from '@vue-tsx-pro/ui';
import { getTask } from '../../../api/tasks';
import { toaster } from '../../../app/feedback';
import { kindOfCode, taskCodePrefix } from '../../../domain/task/code';
import type { CostKind, CostTask } from '../../../domain/task/types';
import { costKinds } from '../../../shared/kinds';
import { RequestView } from '../../../shared/RequestView';
import { DmcEditor } from './DmcEditor';
import { UnitEditor } from './UnitEditor';

/** 抽屉里编辑什么：新建某种降本类型，或某个编号的任务卡 */
export const editorTarget = {
  /** 新建 */
  create: (kind: CostKind) => `new:${kind}`,
  /** 编辑 */
  edit: (code: string) => code,
};

// 抽屉拖动后的宽度各人记住：表单三列放得下的宽度起步
const width = usePersistentState('cost-reduction:editor-width', 1080);

/** 新建、编辑任务卡的抽屉 */
export const TaskEditorDrawer = _component(
  ({
    target = _bindable(''),
    onSaved,
  }: {
    /** 'new:unit'、'new:dmc'、任务编号；空字符串是关着。父级写 target={_bind(x)} */
    target?: string;
    /** 保存成功：页面刷新列表或详情 */
    onSaved?: (task: CostTask) => void;
  }) => {
    const confirm = useConfirm();
    let dirty = _state(false);
    const creating = () => (target.startsWith('new:') ? (target.slice(4) as CostKind) : null);
    const code = () => (target && !creating() ? target : '');
    const task = useRequest((current: string, signal) => getTask(current, signal), {
      params: code,
      enabled: () => code() !== '',
      // 换了编号先显示加载，不把上一张卡的表单留着
      keepPrevious: false,
    });

    /** 能不能关：没改过，或者确认放弃 */
    const mayClose = async () =>
      !dirty ||
      (await confirm({
        title: '放弃未保存的改动？',
        description: '关掉以后这次填的内容不会保存。',
        confirmText: '放弃',
        tone: 'danger',
      }));
    function close() {
      dirty = false;
      target = '';
    }
    function saved(next: CostTask) {
      toaster.show({
        title: creating() ? `已新建 ${next.code}` : `已保存 ${next.code}`,
        tone: 'success',
      });
      close();
      onSaved?.(next);
    }
    const cancel = async () => {
      if (await mayClose()) close();
    };

    return () => {
      const kind = creating() ?? kindOfCode(code());
      const amount = costKinds[kind];
      const Editor = kind === 'unit' ? UnitEditor : DmcEditor;
      return (
        <Drawer
          open={_bind(
            () => target !== '',
            (open: boolean) => {
              if (!open) close();
            },
          )}
          title={creating() ? `新建${amount.label}项目` : `编辑 ${code()}`}
          description={`${amount.codeHeader}按“${taskCodePrefix(kind)}-完成年度-团队拼音缩写-序号”自动生成，不能手改${creating() ? '；保存后生成' : ''}`}
          width={_bind(width.value)}
          beforeClose={mayClose}
        >
          {creating() ? (
            <Editor
              key={target}
              task={null}
              dirty={_bind(dirty)}
              onSaved={saved}
              onCancel={() => void cancel()}
            />
          ) : (
            target && (
              <RequestView request={task} notFound={`没有找到项目 ${code()}`}>
                {(loaded) => (
                  <Editor
                    key={loaded.code}
                    task={loaded}
                    dirty={_bind(dirty)}
                    onSaved={saved}
                    onCancel={() => void cancel()}
                  />
                )}
              </RequestView>
            )
          )}
        </Drawer>
      );
    };
  },
);
