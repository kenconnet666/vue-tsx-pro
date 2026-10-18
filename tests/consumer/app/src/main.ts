import './style.css';
import { createApp } from 'vue';
import { createUi } from '@vue-tsx-pro/ui';
import { App } from './App';

createApp(App).use(createUi()).mount('#app');
