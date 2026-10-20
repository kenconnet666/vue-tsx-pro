import { _component } from '@vue-tsx-pro/tsx';
import { CodeBlock } from '@vue-tsx-pro/ui';

const source = `import { createApp } from 'vue';
import { createUi, oceanTheme } from '@vue-tsx-pro/ui';
import App from './App';

createApp(App)
  .use(createUi({ theme: oceanTheme }))
  .mount('#app');`;

export default _component(() => () => (
  <CodeBlock code={source} lang="ts" title="main.ts" lineNumbers highlightLines="2,6" />
));
