/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'false' 时不启动假后端，请求发给真实后端（/api） */
  readonly VITE_MOCK?: string;
}
