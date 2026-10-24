import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Button, Container, Field, Flex, H3, Small, TextField } from '@vue-tsx-pro/ui';

const styles = css.create({
  page: {
    paddingBlock: '_xl',
    borderRadius: '_md',
    backgroundColor: '_fill',
  },
  form: {
    padding: '_xl',
    borderRadius: '_md',
    backgroundColor: '_surfaceRaised',
    boxShadow: '_sm',
  },
});

export default _component(() => () => (
  <div {...css.attrs(styles.page)}>
    <Container size="xs">
      <Flex direction="column" gap="md" sx={styles.form}>
        <H3 size="lg">登录</H3>
        <Field label="邮箱">
          <TextField type="email" placeholder="you@example.com" />
        </Field>
        <Field label="密码">
          <TextField type="password" />
        </Field>
        <Button>登录</Button>
        <Small tone="muted">Container size="xs"：最宽 30rem，居中，左右留 padding</Small>
      </Flex>
    </Container>
  </div>
));
