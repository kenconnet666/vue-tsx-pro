import { Code2, Eye, SplitSquareHorizontal } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  CodeBlock,
  Flex,
  Icon,
  Paragraph,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@zerodep-dev/vue-tsx-pro-ui';

const source = `<Button tone="success" icon={Check}>
  保存
</Button>`;

const styles = css.create({
  preview: {
    padding: '_lg',
    borderRadius: '_md',
    backgroundColor: '_fill',
  },
});

export default _component(() => () => (
  <Tabs variant="soft" size="sm" activation="manual">
    <TabList aria-label="查看方式">
      <Tab value="preview">
        <Flex align="center" gap="xs">
          <Icon icon={Eye} />
          预览
        </Flex>
      </Tab>
      <Tab value="code">
        <Flex align="center" gap="xs">
          <Icon icon={Code2} />
          代码
        </Flex>
      </Tab>
      <Tab value="split" disabled>
        <Flex align="center" gap="xs">
          <Icon icon={SplitSquareHorizontal} />
          并排（宽屏）
        </Flex>
      </Tab>
    </TabList>
    <TabPanel value="preview">
      <Paragraph sx={styles.preview}>
        这里是效果。activation="manual"：方向键只移动焦点，按 Enter / 空格才切换。
      </Paragraph>
    </TabPanel>
    <TabPanel value="code">
      <CodeBlock code={source} lang="tsx" />
    </TabPanel>
  </Tabs>
));
