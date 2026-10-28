import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { diffProcess, type ProcessDefinition, type ProcessDiff } from '../src/index.ts';
import { readSpec } from './spec.ts';

interface DiffSpec {
  cases: {
    name: string;
    layout?: boolean;
    before: ProcessDefinition;
    after: ProcessDefinition;
    expect: ProcessDiff;
  }[];
}

describe('两个版本的差别（spec/diff）', () => {
  for (const sample of readSpec<DiffSpec>('diff/versions.json').cases) {
    it(sample.name, () =>
      assert.deepEqual(
        diffProcess(sample.before, sample.after, { layout: sample.layout === true }),
        sample.expect,
      ),
    );
  }
});
