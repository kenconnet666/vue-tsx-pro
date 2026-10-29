// H5 入口：同一个页面组件直接挂到浏览器上（小程序那边由 app.ts 交给运行时）
import { createApp } from 'vue';
import { ButtonPage } from './pages/ButtonPage.tsx';

createApp(ButtonPage).mount('#app');
