// Upload、FileDrop：真实的文件选择、上传进度到完成、失败后重试、原生提交用的隐藏 input（演示页 /base）
import axe from 'axe-core';
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let app: App;
let root: HTMLElement;

beforeEach(async () => {
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/base');
  await host.router.isReady();
  root = document.createElement('div');
  document.body.append(root);
  app = host.app;
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
});

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
const states = () =>
  [...root.querySelectorAll<HTMLElement>('.upload-demo li')].map((item) => item.dataset.state);

describe('Upload', () => {
  it('选到文件后上传到完成；失败的可以重试；隐藏的 input 带着全部文件', async () => {
    const input = $<HTMLInputElement>('.upload-demo input[type="file"]:not([hidden])');
    await userEvent.upload(input, [
      new File(['hello'], 'a.txt', { type: 'text/plain' }),
      new File(['oops'], 'fail.txt', { type: 'text/plain' }),
    ]);
    await expect.poll(states).toEqual(['uploading', 'uploading']);
    await expect.poll(states, { timeout: 5000 }).toEqual(['done', 'error']);
    expect($('.upload-demo li[data-state="error"]').textContent).toContain('服务器开小差了');
    expect($<HTMLInputElement>('.upload-demo input[name="attachments"]').files).toHaveLength(2);

    await userEvent.click($('.upload-demo [aria-label="重新上传 fail.txt"]'));
    await expect.poll(states, { timeout: 5000 }).toEqual(['done', 'done']);
    await userEvent.click($('.upload-demo [aria-label="移除 a.txt"]'));
    expect(states()).toEqual(['done']);
  });

  it('FileDrop 只交出 accept 里的文件', async () => {
    await userEvent.upload($<HTMLInputElement>('.file-drop-demo input'), [
      new File(['png'], 'photo.png', { type: 'image/png' }),
    ]);
    await expect.poll(() => $('.file-drop-summary').textContent).toBe('选到：photo.png');
  });

  it('axe-core 没有违规', async () => {
    await userEvent.upload($<HTMLInputElement>('.upload-demo input[type="file"]:not([hidden])'), [
      new File(['hello'], 'a.txt', { type: 'text/plain' }),
    ]);
    await expect.poll(states).toHaveLength(1);
    const result = await axe.run($('.upload-demo'));
    expect(result.violations).toEqual([]);
  });
});
