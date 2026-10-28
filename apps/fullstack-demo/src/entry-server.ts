/** 服务端入口：Nitro 把页面请求（server/ 下的接口之外）交给它 */
import { app } from './app.ts';
import assets from './entry-client.ts?assets=client';
import { createRenderer } from './framework/server.ts';
import { loaders } from './loaders.ts';

// RENDER_MODE=csr：整站改成浏览器渲染
const renderMode = process.env.RENDER_MODE === 'csr' ? 'csr' : 'auto';

export default { fetch: createRenderer({ ...app, assets, loaders, renderMode }) };
