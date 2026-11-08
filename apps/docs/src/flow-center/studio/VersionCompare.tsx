/**
 * 版本对比（工作室的“版本”页签里）：某一版与工作副本差在哪。
 * 图——模型包的 diffProcess：环节、连线加了、删了、改了哪些属性（布局不算）；文件——加的、删的、改过的，改过的逐行比。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { diffProcess, type ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { Badge, Card, Flex, Small, Strong } from '@zerodep-dev/vue-tsx-pro-ui';
import { diffLines, type DiffLine } from './line-diff';
import { definitionOf, sortedPaths } from './project';

/** VersionCompare 的属性 */
export interface VersionCompareProps {
  /** 旧的（某一版） */
  before: Readonly<Record<string, string>>;
  /** 新的（工作副本） */
  after: Readonly<Record<string, string>>;
  /** 旧的叫什么（“第 2 版”） */
  label: string;
}

const styles = css.create({
  code: {
    margin: 0,
    fontFamily: '_mono',
    fontSize: '_sm',
    lineHeight: 1.6,
    overflowX: 'auto',
    borderRadius: '_sm',
    border: '1px solid',
    borderColor: '_border',
  },
  line: { display: 'block', paddingInline: '_sm', whiteSpace: 'pre' },
  added: { backgroundColor: '_successSoft' },
  removed: { backgroundColor: '_dangerSoft' },
  skipped: { color: '_textMuted', fontStyle: 'italic' },
});

const MARK = { same: ' ', added: '+', removed: '-' } as const;

function renderLines(lines: readonly DiffLine[]) {
  return (
    <pre {...css.attrs(styles.code)}>
      {lines.map((line, index) =>
        line.kind === 'skipped' ? (
          <span key={index} {...css.attrs(styles.line, styles.skipped)}>
            {`  … 省略 ${line.count} 行相同的`}
          </span>
        ) : (
          <span
            key={index}
            {...css.attrs(
              styles.line,
              line.kind === 'added' && styles.added,
              line.kind === 'removed' && styles.removed,
            )}
          >
            {`${MARK[line.kind]} ${line.text}`}
          </span>
        ),
      )}
    </pre>
  );
}

/** 图的差别说成一句一句的：环节按名字 */
function graphChanges(before: ProcessDefinition, after: ProcessDefinition): string[] {
  const diff = diffProcess(before, after);
  const name = (definition: ProcessDefinition, id: string) =>
    definition.nodes.find((n) => n.id === id)?.name ?? id;
  return [
    ...(diff.process.length > 0 ? [`流程的设置改了：${diff.process.join('、')}`] : []),
    ...diff.nodes.added.map((id) => `加了环节“${name(after, id)}”`),
    ...diff.nodes.removed.map((id) => `删了环节“${name(before, id)}”`),
    ...diff.nodes.changed.map((c) => `改了环节“${name(after, c.id)}”：${c.keys.join('、')}`),
    ...(diff.edges.added.length + diff.edges.removed.length + diff.edges.changed.length > 0
      ? [
          `连线：加了 ${diff.edges.added.length} 条，删了 ${diff.edges.removed.length} 条，改了 ${diff.edges.changed.length} 条`,
        ]
      : []),
  ];
}

export const VersionCompare = _component(({ before, after, label }: VersionCompareProps) => () => {
  const oldGraph = definitionOf(before);
  const newGraph = definitionOf(after);
  const changes = oldGraph && newGraph ? graphChanges(oldGraph, newGraph) : [];
  const paths = sortedPaths({ ...before, ...after });
  const changedFiles = paths.filter((path) => before[path] !== after[path]);
  return (
    <Flex direction="column" gap="md">
      <Card padding="md" header={`图：${label} → 现在`}>
        {changes.length === 0 ? (
          <Small tone="muted">图没有变（拖动位置不算）。</Small>
        ) : (
          <Flex direction="column" gap="xs">
            {changes.map((change) => (
              <Small key={change}>{change}</Small>
            ))}
          </Flex>
        )}
      </Card>
      {changedFiles.length === 0 ? (
        <Small tone="muted">文件都一样。</Small>
      ) : (
        changedFiles.map((path) => {
          const state =
            before[path] === undefined ? '新加' : after[path] === undefined ? '删了' : '改了';
          return (
            <Flex key={path} direction="column" gap="xs">
              <Flex gap="sm" align="center">
                <Strong>{path}</Strong>
                <Badge tone={state === '删了' ? 'danger' : state === '新加' ? 'success' : 'accent'}>
                  {state}
                </Badge>
              </Flex>
              {renderLines(diffLines(before[path] ?? '', after[path] ?? ''))}
            </Flex>
          );
        })
      )}
    </Flex>
  );
});
