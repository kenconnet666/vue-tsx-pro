/** 发起：选流程、按它声明的变量填表，发起后去审批单 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Alert,
  Button,
  Field,
  Flex,
  H1,
  NumberField,
  TextField,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { useRouter } from 'vue-router';
import { actions, usePageData } from '../client.ts';
import { ActionError } from '../framework/action.ts';

export default _component(() => {
  const data = usePageData('/start');
  const router = useRouter();
  let values = _state<Record<string, any>>({});
  let problem = _state('');
  let busy = _state(false);

  async function start(event: Event, process: string) {
    event.preventDefault();
    busy = true;
    problem = '';
    try {
      const id = await actions.start({ process, variables: { ...values } });
      await router.push(`/instances/${id}`);
    } catch (error) {
      problem = error instanceof ActionError ? error.message : String(error);
    } finally {
      busy = false;
    }
  }

  return () => (
    <Flex direction="column" gap="lg" align="start">
      <H1>发起</H1>
      {problem && <Alert tone="danger">{problem}</Alert>}
      {data.value?.map((process) => (
        <form key={process.key} onSubmit={(event: Event) => void start(event, process.key)}>
          <Flex direction="column" gap="md" align="start">
            <strong>{process.name}</strong>
            {process.variables.map((variable) => (
              <Field key={variable.name} label={variable.label}>
                {variable.type === 'number' ? (
                  <NumberField _value={values[variable.name]} />
                ) : (
                  <TextField _value={values[variable.name]} />
                )}
              </Field>
            ))}
            <Button type="submit" disabled={busy}>
              发起{process.name}
            </Button>
          </Flex>
        </form>
      ))}
    </Flex>
  );
});
