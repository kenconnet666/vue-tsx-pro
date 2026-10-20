import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Avatar, Card, Flex, Small, Text, TextField, VirtualList } from '@vue-tsx-pro/ui';

const surnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜';
const givenNames = ['小满', '一航', '默', '悠', '晴', '浩然', '思远', '雨桐', '子墨', '若溪', '安'];
const departments = ['设计中心', '研发部', '市场部', '财务部', '客服部'];

const contacts = Array.from({ length: 10_000 }, (_, index) => ({
  id: index,
  name: surnames[index % surnames.length]! + givenNames[index % givenNames.length]!,
  department: departments[index % departments.length]!,
  phone: `138${String(index).padStart(8, '0')}`,
}));

const styles = stylex.create({
  list: { height: '22rem' },
  padded: { paddingBlock: '_sm', paddingInline: '_md' },
});

export default _component(() => {
  let keyword = _state('');
  return () => {
    const list = keyword
      ? contacts.filter(
          (contact) => contact.name.includes(keyword) || contact.phone.includes(keyword),
        )
      : contacts;
    return (
      <Card padding="none">
        <Flex align="center" justify="between" gap="md" sx={styles.padded}>
          <TextField
            value={_bind(keyword)}
            type="search"
            clearable
            placeholder="姓名或电话"
            aria-label="搜索联系人"
          />
          <Small tone="muted">共 {list.length.toLocaleString()} 人</Small>
        </Flex>
        <VirtualList
          items={list}
          itemKey={(contact) => contact.id}
          estimateSize={56}
          aria-label="联系人"
          sx={styles.list}
          empty={
            <Text tone="muted" sx={styles.padded}>
              没有找到“{keyword}”
            </Text>
          }
        >
          {(contact) => (
            <Flex align="center" gap="md" sx={styles.padded}>
              <Avatar size="sm" name={contact.name} />
              <Flex direction="column">
                <Text weight="medium">{contact.name}</Text>
                <Small tone="muted">
                  {contact.department} · {contact.phone}
                </Small>
              </Flex>
            </Flex>
          )}
        </VirtualList>
      </Card>
    );
  };
});
