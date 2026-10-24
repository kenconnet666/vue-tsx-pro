// 上线检查：可以勾选（onCheckedChange），状态图标是复选按钮，名称就是这一项；不适用、受阻的不能勾。
// 勾完全部，进度条变成成功色
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Checklist, type ChecklistItem } from '@vue-tsx-pro/ui';

export default _component(() => {
  let items = _state<ChecklistItem[]>([
    {
      key: 'backup',
      label: '数据库备份',
      description: '上线前全量备份，保留 7 天',
      status: 'done',
    },
    { key: 'migration', label: '执行迁移脚本', description: 'V42__add_benefit_lock.sql' },
    { key: 'config', label: '核对生产配置', description: '对照配置清单逐项确认', owner: '运维' },
    { key: 'smoke', label: '冒烟测试', owner: '测试', status: 'blocked', date: '等迁移完成' },
    { key: 'cdn', label: '刷新 CDN', status: 'skipped', description: '这次没有静态资源改动' },
  ]);
  return () => (
    <Card>
      <Checklist
        items={items}
        summary
        onCheckedChange={(changed, done) =>
          (items = items.map((item) =>
            item.key === changed.key ? { ...item, status: done ? 'done' : 'todo' } : item,
          ))
        }
      />
    </Card>
  );
});
