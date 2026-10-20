import { ArrowRight, Download, Plus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex gap="sm" wrap>
    <Button icon={Plus}>新建</Button>
    <Button variant="soft" icon={Download}>
      下载
    </Button>
    <Button variant="ghost" iconEnd={ArrowRight}>
      下一步
    </Button>
  </Flex>
));
