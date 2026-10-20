import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, IconButton, Kbd, Separator, Tooltip, type IconData } from '@vue-tsx-pro/ui';

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
    </Flex>
  </Card>
));
