import { Bell, KeyRound, User } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Checkbox,
  Field,
  Flex,
  Icon,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  type IconData,
} from '@vue-tsx-pro/ui';

const sections: [string, string, IconData][] = [
  ['profile', '个人资料', User],
  ['security', '账号安全', KeyRound],
  ['notifications', '通知', Bell],
];

const styles = stylex.create({
  list: { minWidth: '9rem' },
  panel: { flexGrow: 1, minWidth: 0 },
});

export default _component(() => () => (
  <Tabs orientation="vertical">
    <TabList aria-label="设置" sx={styles.list}>
      {sections.map(([value, label, icon]) => (
        <Tab key={value} value={value}>
          <Flex align="center" gap="sm">
            <Icon icon={icon} />
            {label}
          </Flex>
        </Tab>
      ))}
    </TabList>
    <TabPanel value="profile" sx={styles.panel}>
      <Flex direction="column" gap="md">
        <Field label="昵称">
          <TextField value="周一航" />
        </Field>
        <Field label="个人主页">
          <TextField type="url" placeholder="https://" />
        </Field>
      </Flex>
    </TabPanel>
    <TabPanel value="security" sx={styles.panel}>
      <Flex direction="column" gap="md">
        <Switch checked>两步验证</Switch>
        <Switch>新设备登录时提醒</Switch>
      </Flex>
    </TabPanel>
    <TabPanel value="notifications" sx={styles.panel}>
      <Flex direction="column" gap="sm">
        <Checkbox checked>订单状态变化</Checkbox>
        <Checkbox checked>有人提到我</Checkbox>
        <Checkbox>每周报告</Checkbox>
      </Flex>
    </TabPanel>
  </Tabs>
));
