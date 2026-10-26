// 在抽屉里编辑、列表留在原处：靠正文的一边可以拖宽、拖到几乎关上（width 双向绑定，记在浏览器里）；
// 有没保存的改动时，取消、关闭按钮、Esc、点遮罩都先经过 beforeClose 确认；保存用 onConfirm（保存时加载中、关不掉）
import { Pencil } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
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
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  const confirm = useConfirm();
  let open = _state(false);
  const initial = { name: '显示器支架合并', note: '两件合并为一件，减少紧固件' };
  let saved = _state(initial);
  let draft = _state({ ...initial });
  // 拖动后的宽度各人记住
  let width = _fromRef(usePersistentState('docs:edit-drawer-width', 560));
  const dirty = () => draft.name !== saved.name || draft.note !== saved.note;
  /** 能不能关：没改过，或者确认放弃（取消、关闭按钮、Esc、点遮罩都走这里） */
  const mayClose = async () =>
    !dirty() ||
    (await confirm({ title: '放弃未保存的改动？', confirmText: '放弃', tone: 'danger' }));

  function edit() {
    draft = { ...saved };
    open = true;
  }
  async function save() {
    await new Promise((resolve) => setTimeout(resolve, 600));
    saved = { ...draft };
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
        _open={open}
        title="编辑项目"
        description="改了没保存时关闭会先确认；左边的竖线可以拖动调宽，往右拖到底只剩一窄条"
        _width={width}
        beforeClose={mayClose}
        confirmText="保存"
        onConfirm={save}
        propsConfirm={{ disabled: !dirty() }}
      >
        <Flex direction="column" gap="md">
          <Field label="项目名称" required>
            <TextField _value={draft.name} />
          </Field>
          <Field label="简要描述">
            <Textarea _value={draft.note} rows={4} />
          </Field>
        </Flex>
      </Drawer>
    </Card>
  );
});
