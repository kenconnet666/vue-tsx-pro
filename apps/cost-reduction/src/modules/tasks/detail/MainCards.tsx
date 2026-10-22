/**
 * 项目详情的左栏：概览（主表字段，与编辑页同组）、降本明细（单机：零件更改与收益）或实施节点（降 DMC）；
 * 流程与流转记录在 WorkflowPanel
 */
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  Descriptions,
  Flex,
  H2,
  Small,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  useFormat,
} from '@vue-tsx-pro/ui';
import { dictLabel, personName } from '../../../app/master';
import { partSaving, unitSaving } from '../../../domain/task/calc';
import { daysToDue } from '../../../domain/task/status';
import type { CostTask, UnitDetail } from '../../../domain/task/types';
import { yuanFormat } from '../../../shared/kinds';

/** 概览：主表字段只读展示（单机与降 DMC 的主表不同） */
export const OverviewCard = _component(({ task }: { task: CostTask }) => () => {
  const unit = task.kind === 'unit';
  return (
    <Card variant="outline" header={<H2 size="sm">概览</H2>}>
      <Descriptions
        columns={3}
        size="sm"
        items={[
          ...(unit
            ? [
                { label: '任务类别', value: dictLabel('categories', task.category) },
                { label: '提出单位 / 部门', value: `${task.org} / ${task.dept}` },
              ]
            : [{ label: '提出单位', value: task.org }]),
          { label: '必装 / 选装', value: dictLabel('installTypes', task.install) },
          { label: '数模编号 + 版本', value: task.modelNo || '—' },
          ...(unit ? [] : [{ label: '供应商件号', value: task.supplierPartNos.join('、') || '—' }]),
          { label: '完成年度', value: unit ? task.year : task.due },
          { label: '贯彻架次', value: task.flights ?? '—' },
          { label: '完成形式', value: task.form },
          { label: '涉及供应商', value: task.supplier },
          ...(unit
            ? [
                {
                  label: '经费来源',
                  value:
                    task.funding.map((item) => dictLabel('fundingSources', item)).join('、') || '—',
                },
                { label: '项目建议书编号', value: task.proposalNo || '—' },
              ]
            : [{ label: '需要 SB 贯彻', value: task.needSb ? '是' : '否' }]),
          { label: '型号 / 工作包', value: `${task.model} / ${task.workPackage}` },
          { label: '简要描述', value: task.description, span: 3 },
        ]}
      />
    </Card>
  );
});

/** 降本明细（单机降本）：明细表的项目信息、工程评估与每条零件更改的收益 */
export const PartsCard = _component(({ detail }: { detail: UnitDetail }) => {
  const format = useFormat();
  const yuan = (value: Parameters<typeof format.number>[0]) => format.number(value, yuanFormat);
  return () => (
    <Card
      variant="outline"
      header={<H2 size="sm">降本明细</H2>}
      extra={
        <Small tone="muted">
          {detail.parts.length} 条零件更改 · 单机零件收益合计 {yuan(unitSaving(detail))} 元
        </Small>
      }
    >
      <Flex direction="column" gap="md">
        <Descriptions
          columns={3}
          size="sm"
          items={[
            { label: '构型通知单', value: detail.notices.join('、') },
            { label: '工程责任人', value: personName(detail.engineer) },
            { label: '是否双定点', value: detail.dualSource ? '是' : '否' },
            {
              label: '工程初步评估',
              value: `${detail.evaluation.opinion}${detail.evaluation.type ? `（${detail.evaluation.type}）` : ''}`,
            },
            // 暂不具备实施条件、待评估时才有原因
            ...(detail.evaluation.reason
              ? [{ label: '具体原因', value: detail.evaluation.reason, span: 2 }]
              : []),
            { label: '项目描述', value: detail.projectDescription, span: 3 },
            { label: '项目优化内容', value: detail.optimization, span: 3 },
          ]}
        />
        <Table aria-label="零件更改与收益" density="compact">
          <TableHead>
            <TableRow>
              <TableHeaderCell>序号</TableHeaderCell>
              <TableHeaderCell>更改类型</TableHeaderCell>
              <TableHeaderCell>更改前件号</TableHeaderCell>
              <TableHeaderCell>更改后件号</TableHeaderCell>
              <TableHeaderCell>材料变化</TableHeaderCell>
              <TableHeaderCell align="end">单机数量</TableHeaderCell>
              <TableHeaderCell align="end">单件零件收益（元）</TableHeaderCell>
              <TableHeaderCell align="end">单机零件收益（元）</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detail.parts.map((change, index) => {
              const saving = partSaving(change);
              const side = change.after ?? change.before;
              return (
                <TableRow key={change.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{change.changeType}</TableCell>
                  <TableCell>
                    <Text mono size="sm">
                      {change.before?.partNo ?? '—'}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text mono size="sm">
                      {change.after?.partNo ?? '—'}
                    </Text>
                  </TableCell>
                  <TableCell>
                    {side?.materialChanged
                      ? `${change.before?.materialGrade} → ${change.after?.materialGrade}`
                      : '否'}
                  </TableCell>
                  <TableCell align="end">{side?.quantity}</TableCell>
                  <TableCell align="end">
                    <Text numeric>{yuan(saving.part)}</Text>
                  </TableCell>
                  <TableCell align="end">
                    <Text numeric>{yuan(saving.aircraft)}</Text>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Flex>
    </Card>
  );
});

/** 实施节点（降 DMC）：完成形式、计划与实际完成、超时、贯彻架次、责任团队、是否需要 SB */
export const NodesCard = _component(({ task }: { task: CostTask }) => () => (
  <Card
    variant="outline"
    header={<H2 size="sm">实施节点</H2>}
    extra={
      <Small tone="muted">
        已完成 {task.dmcNodes.filter((node) => node.done).length} / {task.dmcNodes.length}
      </Small>
    }
  >
    <Table aria-label="实施节点" density="compact">
      <TableHead>
        <TableRow>
          <TableHeaderCell>序号</TableHeaderCell>
          <TableHeaderCell>完成形式</TableHeaderCell>
          <TableHeaderCell>计划完成</TableHeaderCell>
          <TableHeaderCell>实际完成</TableHeaderCell>
          <TableHeaderCell>情况</TableHeaderCell>
          <TableHeaderCell align="end">贯彻架次</TableHeaderCell>
          <TableHeaderCell>责任一级团队</TableHeaderCell>
          <TableHeaderCell>需要 SB</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {task.dmcNodes.map((node, index) => {
          const days = daysToDue(node);
          return (
            <TableRow key={node.form}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{node.form}</TableCell>
              <TableCell>{node.due}</TableCell>
              <TableCell>{node.done ?? '—'}</TableCell>
              <TableCell>
                {node.done ? (
                  <Small tone="success">已完成</Small>
                ) : days < 0 ? (
                  <Small tone="danger">超 {-days} 天</Small>
                ) : (
                  <Small tone={days <= 7 ? 'warning' : 'muted'}>还剩 {days} 天</Small>
                )}
              </TableCell>
              <TableCell align="end">{node.flights ?? '—'}</TableCell>
              <TableCell>{node.team}</TableCell>
              <TableCell>{node.needSb ? '是' : '否'}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Card>
));
