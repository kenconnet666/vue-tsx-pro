// 在抽屉里编辑、列表留在原处：靠正文的一边可以拖宽、拖到几乎关上（width 双向绑定，记在浏览器里）；
// 有没保存的改动时，关闭按钮、Esc、点遮罩都先经过 beforeClose 确认
import { Pencil } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  Drawer,
  Field,
  Flex,
  Small,
  Textarea,
  TextField,
  useConfirm,
  usePersistentState,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  const confirm = useConfirm();
  let open = _state(false);
  let saved = _state({ name: '整流罩支架合并', note: '两件合并为一件，减少紧固件' });
  let draft = _state({ ...saved });
  // 拖动后的宽度各人记住
  let width = _fromRef(usePersistentState('docs:edit-drawer-width', 560));
  const dirty = () => draft.name !== saved.name || draft.note !== saved.note;
  /** 能不能关：没改过，或者确认放弃（关闭按钮、Esc、点遮罩、取消都走这里） */
  const mayClose = async () =>
    !dirty() ||
    (await confirm({ title: '放弃未保存的改动？', confirmText: '放弃', tone: 'danger' }));

  function edit() {
    draft = { ...saved };
    open = true;
  }
  function save() {
    saved = { ...draft };
    open = false;
  }

  return () => (
    <Card>
      <Flex align="center" justify="between" gap="md">
        <Flex direction="column" gap="xs">
          <span>{saved.name}</span>
          <Small tone="muted">{saved.note}</Small>
        </Flex>
        <Button variant="soft" icon={Pencil} onClick={edit}>
          编辑
        </Button>
      </Flex>
      <Drawer
        open={_bind(open)}
        title="编辑项目"
        description="改了没保存时关闭会先确认；左边的竖线可以拖动调宽，往右拖到底只剩一窄条"
        width={_bind(width)}
        beforeClose={mayClose}
        footer={
          <>
            <Button
              variant="ghost"
              tone="neutral"
              onClick={() =>
                void mayClose().then((ok) => {
                  if (ok) open = false;
                })
              }
            >
              取消
            </Button>
            <Button onClick={save} disabled={!dirty()}>
              保存
            </Button>
          </>
        }
      >
        <Flex direction="column" gap="md">
          <Field label="项目名称" required>
            <TextField value={_bind(draft.name)} />
          </Field>
          <Field label="简要描述">
            <Textarea value={_bind(draft.note)} rows={4} />
          </Field>
        </Flex>
      </Drawer>
    </Card>
  );
});
