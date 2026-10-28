// 设计器的编辑操作：模板都能通过校验；加环节、加分支、删环节后仍通过校验、路接得上；问题用业务的话说
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  addAmountBranch,
  addApprovalStep,
  problemMessage,
  removeStep,
  selectEdges,
  processGraph,
  templates,
  validateProcess,
  type ProcessDefinition,
} from '../src/index.ts';

const errors = (definition: ProcessDefinition) =>
  validateProcess(definition).filter((p) => p.severity === 'error');

describe('设计器的编辑操作', () => {
  it('模板都能通过校验', () => {
    for (const [name, make] of Object.entries(templates)) {
      assert.deepEqual(errors(make()), [], name);
    }
  });

  it('加审批环节：接在原来的路上，同意接着走、不同意到不通过', () => {
    const draft = addApprovalStep(templates.expense(), 'finance', {
      name: '总监审批',
      assignees: [{ role: '3' }],
    });
    assert.deepEqual(errors(draft), []);
    const graph = processGraph(draft);
    const [next] = selectEdges(graph, 'finance', { outcome: 'approve', read: () => undefined });
    assert.equal(graph.node(next!.to)?.name, '总监审批');
    const [after] = selectEdges(graph, next!.to, { outcome: 'approve', read: () => undefined });
    assert.equal(after?.to, 'approved');
  });

  it('加金额分支：超过的多走一个环节，其余照原来的路', () => {
    const draft = addAmountBranch(templates.expense(), 'finance', {
      field: 'amount',
      over: 5000,
      step: { name: '总经理审批', assignees: [{ role: '4' }] },
    });
    assert.deepEqual(errors(draft), []);
    const graph = processGraph(draft);
    const gateway = selectEdges(graph, 'finance', { outcome: 'approve', read: () => undefined })[0]!
      .to;
    const big = selectEdges(graph, gateway, {
      read: (f) => (f === 'amount' ? 8000 : undefined),
    })[0]!;
    const small = selectEdges(graph, gateway, {
      read: (f) => (f === 'amount' ? 100 : undefined),
    })[0]!;
    assert.equal(graph.node(big.to)?.name, '总经理审批');
    assert.equal(small.to, 'approved');
  });

  it('删环节：前后接上，删开始、结束报错', () => {
    const draft = removeStep(templates.leave(), 'manager');
    assert.deepEqual(errors(draft), []);
    assert.equal(processGraph(draft).node('manager'), undefined);
    assert.throws(() => removeStep(draft, 'start'), /不能删/);
  });

  it('问题用业务的话说', () => {
    const broken = {
      ...templates.expense(),
      nodes: templates
        .expense()
        .nodes.map((n) => (n.id === 'finance' ? { ...n, assignees: [] } : n)),
    };
    const messages = validateProcess(broken).map((p) => problemMessage(p, broken));
    assert.ok(
      messages.some((m) => m.includes('“财务复核”没有处理人')),
      messages.join('\n'),
    );
  });
});
