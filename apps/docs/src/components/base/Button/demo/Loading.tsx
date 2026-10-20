import { _component } from '@vue-tsx-pro/tsx';
import { Button } from '@vue-tsx-pro/ui';

export default _component(() => {
  let saving = _state(false);

  async function save() {
    saving = true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    saving = false;
  }

  return () => (
    <Button loading={saving} onClick={() => void save()}>
      保存
    </Button>
  );
});
