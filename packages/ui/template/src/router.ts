import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/orders' },
    { path: '/orders', component: () => import('./pages/OrderList') },
    { path: '/orders/new', component: () => import('./pages/OrderEdit') },
    { path: '/orders/:id', component: () => import('./pages/OrderDetail') },
    { path: '/orders/:id/edit', component: () => import('./pages/OrderEdit') },
  ],
});
