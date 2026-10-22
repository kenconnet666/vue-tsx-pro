/** 编辑项目：取回任务卡后按降本类型打开单机降本或降 DMC 的编辑表单 */
import { _component } from '@vue-tsx-pro/tsx';
import { useRequest } from '@vue-tsx-pro/ui';
import { useRoute } from 'vue-router';
import { getTask } from '../../../api/tasks';
import { RequestView } from '../../../shared/RequestView';
import { DmcEditor } from './DmcEditor';
import { UnitEditor } from './UnitEditor';

export default _component(() => {
  const route = useRoute();
  const code = () => String(route.params.code);
  const request = useRequest((current: string, signal) => getTask(current, signal), {
    params: code,
  });
  // 换了编号就是另一张表单：按编号做 key，表单的初始值重新取
  return () => (
    <RequestView request={request} notFound={`没有找到项目 ${code()}`}>
      {(task) =>
        task.kind === 'unit' ? (
          <UnitEditor key={task.code} task={task} />
        ) : (
          <DmcEditor key={task.code} task={task} />
        )
      }
    </RequestView>
  );
});
