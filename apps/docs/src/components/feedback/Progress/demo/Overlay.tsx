import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  Field,
  Flex,
  Grid,
  LoadingOverlay,
  Switch,
  TextField,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  let saving = _state(false);
  let blur = _state(true);
  let name = _state('vue-tsx-pro');
  let owner = _state('林小满');

  function save() {
    saving = true;
    setTimeout(() => (saving = false), 1600);
  }

  return () => (
    <Flex direction="column" gap="md">
      <Flex align="center" gap="sm">
        <Switch _checked={_bind(blur)}>模糊下面的内容</Switch>
      </Flex>
      <LoadingOverlay loading={saving} blur={blur} label="正在保存">
        <Card>
          <Flex direction="column" gap="md">
            <Grid minItemWidth="12em" gap="md">
              <Field label="项目名称">
                <TextField _value={_bind(name)} disabled={saving} />
              </Field>
              <Field label="负责人">
                <TextField _value={_bind(owner)} disabled={saving} />
              </Field>
            </Grid>
            <Flex justify="end">
              <Button loading={saving} onClick={save}>
                保存
              </Button>
            </Flex>
          </Flex>
        </Card>
      </LoadingOverlay>
    </Flex>
  );
});
