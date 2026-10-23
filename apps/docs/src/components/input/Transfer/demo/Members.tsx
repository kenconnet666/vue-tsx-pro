// 项目成员：从全部成员里挑人加入项目，可搜索（认拼音），离职的人不能选；双击一项直接移过去
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Small, Transfer } from '@vue-tsx-pro/ui';

interface Member {
  id: string;
  name: string;
  team: string;
  left?: boolean;
}

const names = [
  ['周一航', '设计'],
  ['许悠', '设计'],
  ['林小满', '前端'],
  ['赵浩然', '前端'],
  ['陈默', '后端'],
  ['韩笑', '后端'],
  ['宋知遥', '测试'],
  ['顾北辰', '运维'],
  ['沈清禾', '产品'],
  ['陆星河', '前端'],
  ['唐语桐', '后端'],
  ['温子期', '测试'],
  ['苏念', '产品'],
  ['江屿', '设计'],
] as const;

const members: Member[] = names.map(([name, team], index) => ({
  id: `u${index + 1}`,
  name,
  team,
  left: index === 6 || index === 11,
}));

export default _component(() => {
  let joined = _state(['u3', 'u5']);
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="项目成员" description="勾上之后点中间的箭头，或双击一项">
        <Transfer
          items={members}
          toOption={(member) => ({
            value: member.id,
            label: member.name,
            description: member.left ? `${member.team} · 已离职` : member.team,
            disabled: member.left,
          })}
          value={_bind(joined)}
          titles={['全部成员', '项目成员']}
          searchable
        />
      </Field>
      <Small tone="muted">
        已加入 {joined.length} 人：
        {joined.map((id) => members.find((member) => member.id === id)?.name).join('、')}
      </Small>
    </Flex>
  );
});
