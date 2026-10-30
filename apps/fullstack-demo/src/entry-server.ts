/** 服务端入口：Nitro 把页面请求与框架的接口（server/ 下的接口之外）交给它 */
import { actions } from './actions.ts';
import { app } from './app.ts';
import assets from './entry-client.ts?assets=client';
import { createRenderer } from '@zerodep-dev/vue-tsx-pro-kit/server';
import { loaders } from './loaders.ts';
import { createContext, sessionOf } from './server/context.ts';
import { hub } from './server/invalidation.ts';

// RENDER_MODE=csr：整站改成浏览器渲染
const renderMode = process.env.RENDER_MODE === 'csr' ? 'csr' : 'auto';

export default {
  fetch: createRenderer({
    ...app,
    assets,
    loaders,
    actions,
    createContext,
    session: sessionOf,
    renderMode,
    invalidation: hub,
  }),
};
