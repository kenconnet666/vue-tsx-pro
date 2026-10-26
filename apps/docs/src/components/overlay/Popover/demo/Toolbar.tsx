import {
  Bold,
  Ellipsis,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
} from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Flex,
  IconButton,
  Kbd,
  Menu,
  MenuItem,
  mergeProps,
  Separator,
  Tooltip,
  type IconData,
  type MenuTriggerProps,
  type TooltipTriggerProps,
} from '@zerodep-dev/vue-tsx-pro-ui';

const groups: [IconData, string, string?][][] = [
  [
    [Bold, '加粗', 'Ctrl B'],
    [Italic, '斜体', 'Ctrl I'],
    [Underline, '下划线', 'Ctrl U'],
    [Strikethrough, '删除线'],
  ],
  [
    [List, '无序列表'],
    [ListOrdered, '有序列表'],
    [Quote, '引用'],
  ],
  [[Link2, '插入链接', 'Ctrl K']],
];

export default _component(() => () => (
  <Card padding="xs">
    <Flex align="center" gap="xs" wrap>
      {groups.map((group, index) => (
        <>
          {index > 0 && <Separator orientation="vertical" />}
          {group.map(([icon, label, shortcut]) => (
            <Tooltip
              key={label}
              trigger={(props) => <IconButton {...props} icon={icon} aria-label={label} />}
            >
              {label}
              {shortcut && (
                <>
                  {' '}
                  {shortcut.split(' ').map((key, index) => (
                    <>
                      {index > 0 && ' + '}
                      <Kbd key={key}>{key}</Kbd>
                    </>
                  ))}
                </>
              )}
            </Tooltip>
          ))}
        </>
      ))}
      <Separator orientation="vertical" />
      {/* 同一个按钮既有提示又打开菜单：mergeProps 合并两边的属性，ref 与事件都保留 */}
      <Tooltip
        trigger={(tip) => (
          <Menu
            trigger={(menu) => (
              <IconButton
                {...mergeProps<TooltipTriggerProps & MenuTriggerProps>(tip, menu)}
                icon={Ellipsis}
                aria-label="更多格式"
              />
            )}
          >
            <MenuItem>上标</MenuItem>
            <MenuItem>下标</MenuItem>
            <MenuItem>清除格式</MenuItem>
          </Menu>
        )}
      >
        更多格式
      </Tooltip>
    </Flex>
  </Card>
));
