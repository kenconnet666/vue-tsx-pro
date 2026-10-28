/** 示例的“登录”：GET /api/sign-in?user=alice 记下选的用户（user 为空时退出），回到 back 指的页面 */
import { defineHandler } from 'nitro/h3';
import { USER_COOKIE, USERS } from '../../src/server/context.ts';

export default defineHandler((event) => {
  const url = new URL(event.req.url);
  const user = url.searchParams.get('user') ?? '';
  const back = url.searchParams.get('back') ?? '/';
  const valid = Object.hasOwn(USERS, user);
  const cookie = valid
    ? `${USER_COOKIE}=${user}; Path=/; HttpOnly; SameSite=Lax`
    : `${USER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  // 只回到站内的地址
  const location = back.startsWith('/') && !back.startsWith('//') ? back : '/';
  return new Response(null, { status: 302, headers: { location, 'set-cookie': cookie } });
});
