// createEditor 的句柄：edit 进撤销历史、undo/redo、goTo 把光标放到行列（超出时取最近的）
import { expect, it } from 'vitest';
import { createEditor } from '../editor';

function editorWith(code: string) {
  const parent = document.body.appendChild(document.createElement('div'));
  return createEditor(parent, { code, dark: false, label: 'code', onChange: () => {} });
}

it('edit 一步撤销、重做', () => {
  const editor = editorWith('abc');
  editor.edit([{ from: 3, to: 3, insert: 'd' }]);
  expect(editor.view.state.doc.toString()).toBe('abcd');
  expect(editor.undo()).toBe(true);
  expect(editor.view.state.doc.toString()).toBe('abc');
  expect(editor.redo()).toBe(true);
  expect(editor.view.state.doc.toString()).toBe('abcd');
  editor.destroy();
});

it('goTo 按行列放光标，超出的行列取最近的', () => {
  const editor = editorWith('first\nsecond line\nthird');
  // happy-dom 写 DOM 选区时同步发 selectionchange（浏览器是异步的），有焦点时 CodeMirror 会在更新中途再更新：这里不聚焦
  editor.view.focus = () => {};
  editor.goTo(2, 8);
  expect(editor.view.state.selection.main.head).toBe('first\n'.length + 7);
  editor.goTo(9, 99);
  expect(editor.view.state.selection.main.head).toBe(editor.view.state.doc.length);
  editor.destroy();
});
