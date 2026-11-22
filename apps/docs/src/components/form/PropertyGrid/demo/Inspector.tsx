// 编辑器的检查器：一个实体的几个组件，每个组件是一节紧凑、可折叠的 FormSection（density="compact"），标题栏结束边是
// 去掉它的按钮；节里是这个组件的 PropertyGrid。下面的菜单把没加的组件加回来
import { Plus, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  Card,
  Empty,
  Flex,
  FormSection,
  IconButton,
  Menu,
  MenuItem,
  Paragraph,
  PropertyGrid,
  setPropertyPath,
  type PropertyField,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface Component {
  readonly label: string;
  readonly fields: PropertyField[];
  readonly initial: Record<string, unknown>;
}

const COMPONENTS: Record<string, Component> = {
  transform: {
    label: '变换',
    fields: [
      { name: 'position', label: '位置', type: { kind: 'vector', size: 3 } },
      { name: 'scale', label: '缩放', type: { kind: 'vector', size: 3 } },
    ],
    initial: { position: [0, 1.5, 0], scale: [1, 1, 1] },
  },
  light: {
    label: '灯光',
    fields: [
      { name: 'color', label: '颜色', type: { kind: 'color', space: 'linear' } },
      { name: 'intensity', label: '强度', type: { kind: 'number', min: 0, step: 0.1 } },
      { name: 'shadow', label: '投阴影', type: { kind: 'bool' } },
    ],
    initial: { color: [1, 0.85, 0.6, 1], intensity: 3, shadow: true },
  },
  audio: {
    label: '声源',
    fields: [
      { name: 'volume', label: '音量', type: { kind: 'number', min: 0, max: 1, step: 0.05 } },
      { name: 'loop', label: '循环', type: { kind: 'bool' } },
    ],
    initial: { volume: 0.8, loop: false },
  },
};

const styles = css.create({
  panel: { width: '100%', maxWidth: '26rem', fontSize: '_sm' },
  add: { alignSelf: 'flex-start' },
});

export default _component(() => {
  let entity = _state<Record<string, Record<string, unknown>>>({
    transform: COMPONENTS.transform!.initial,
    light: COMPONENTS.light!.initial,
  });
  const remove = (key: string) => {
    const { [key]: _removed, ...rest } = entity;
    entity = rest;
  };
  return () => {
    const keys = Object.keys(COMPONENTS);
    return (
      <Card padding="sm" sx={styles.panel}>
        <Flex direction="column" gap="sm">
          <Paragraph tone="muted" size="sm">
            Lamp · 3 个子实体
          </Paragraph>
          {Object.keys(entity).length === 0 && <Empty size="sm" description="没有组件" />}
          {keys
            .filter((key) => entity[key])
            .map((key) => (
              <FormSection
                key={key}
                density="compact"
                collapsible
                title={COMPONENTS[key]!.label}
                extra={
                  <IconButton
                    icon={X}
                    size="sm"
                    variant="ghost"
                    aria-label={`去掉${COMPONENTS[key]!.label}`}
                    onClick={() => remove(key)}
                  />
                }
              >
                <PropertyGrid
                  fields={COMPONENTS[key]!.fields}
                  value={entity[key]}
                  onSet={(path, value) =>
                    (entity = {
                      ...entity,
                      [key]: setPropertyPath(entity[key]!, path, value) as Record<string, unknown>,
                    })
                  }
                />
              </FormSection>
            ))}
          <Menu
            trigger={(props) => (
              <Button
                {...props}
                sx={styles.add}
                size="sm"
                variant="soft"
                tone="neutral"
                icon={Plus}
              >
                加组件
              </Button>
            )}
          >
            {keys
              .filter((key) => !entity[key])
              .map((key) => (
                <MenuItem
                  onAction={() => (entity = { ...entity, [key]: COMPONENTS[key]!.initial })}
                >
                  {COMPONENTS[key]!.label}
                </MenuItem>
              ))}
          </Menu>
        </Flex>
      </Card>
    );
  };
});
