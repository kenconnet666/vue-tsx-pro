import { defineStore } from 'pinia';
import { ref } from 'vue';

/** 宿主原有的 store：普通 Vue 写法，不知道 TSX 页面的存在 */
export const useUserStore = defineStore('user', () => {
  const name = ref('Ada');
  return { name };
});
