import './style.css';
import { createApp } from 'vue';
import { createUi } from '@zerodep-dev/vue-tsx-pro-ui';
import { createShikiHighlighter } from '@zerodep-dev/vue-tsx-pro-ui/shiki';
import { App } from './App';

createApp(App)
  .use(createUi({ highlighter: createShikiHighlighter() }))
  .mount('#app');
