// 全公司的人太多，按 @ 后面的文字远程搜索（load，停下 300 ms 后请求，只采用最后一次）；
// 选项自己渲染（children）：头像、姓名与部门。数据是任意结构，用 toOption 映射成选项
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, Field, Flex, Mentions, Small, Text } from '@vue-tsx-pro/ui';

interface Employee {
  id: string;
  name: string;
  department: string;
}

const surnames = '王 李 张 刘 陈 杨 黄 赵 周 吴 徐 孙 马 朱 胡 郭 何 林 罗 高'.split(' ');
const givenNames = ['小满', '一航', '思远', '可欣', '子墨', '雨桐', '浩然', '静怡', '宇轩', '梦洁'];
const departments = ['采购部', '成本团队', '质量部', '工程部', '财务部'];
const employees: Employee[] = surnames.flatMap((surname, row) =>
  givenNames.map((given, column) => ({
    id: `E${String(row * 10 + column + 1).padStart(4, '0')}`,
    name: surname + given,
    department: departments[(row + column) % departments.length]!,
  })),
);

/** 模拟接口：按姓名或工号搜索，最多 20 条，延迟 400 ms */
const search = (query: string, signal: AbortSignal) =>
  new Promise<Employee[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(
        employees
          .filter((employee) => employee.name.includes(query) || employee.id.includes(query))
          .slice(0, 20),
      );
    }, 400);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

export default _component(() => {
  let text = _state('');
  let mentioned = _state<string[]>([]);
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="留言" description={`共 ${employees.length} 人；试试输入 @林 或 @E001`}>
        <Mentions
          _value={_bind(text)}
          _mentions={_bind(mentioned)}
          load={search}
          toOption={(employee: Employee) => ({
            value: employee.id,
            label: employee.name,
            description: employee.department,
          })}
          rows={2}
        >
          {(employee: Employee) => (
            <Flex gap="sm" align="center">
              <Avatar name={employee.name} size="xs" />
              <Text>{employee.name}</Text>
              <Small tone="muted">
                {employee.department} · {employee.id}
              </Small>
            </Flex>
          )}
        </Mentions>
      </Field>
      <Small tone="muted">提及的工号：{mentioned.join('、') || '无'}</Small>
    </Flex>
  );
});
