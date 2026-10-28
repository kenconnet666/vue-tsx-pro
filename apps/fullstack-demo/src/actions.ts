/**
 * action（只在服务端导入）：入参按 zod 校验，要求权限；浏览器经 src/client.ts 的 actions 调用。
 * 插入时 tenant 拦截器补上当前租户，改的时候也只改得到当前租户的
 */
import { z } from 'zod';
import { defineAction, defineActions } from './framework/action.ts';
import { db, Todo } from './server/db.ts';

export const actions = defineActions({
  addTodo: defineAction(
    {
      input: z.object({ title: z.string().trim().min(1, '写点什么').max(60) }),
      permission: 'todo.write',
    },
    async ({ title }) => Number(await db.insert(Todo).values({ title, done: false }).returnId()),
  ),
  toggleTodo: defineAction(
    { input: z.object({ id: z.number().int(), done: z.boolean() }), permission: 'todo.write' },
    ({ id, done }) =>
      db
        .update(Todo)
        .set({ done })
        .where((t) => t.id.eq(id))
        .execute(),
  ),
});
