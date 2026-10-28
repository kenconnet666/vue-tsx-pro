/** 健康检查：GET /api/health（部署探活、端到端测试等服务就绪） */
import { defineHandler } from 'nitro/h3';

export default defineHandler(() => ({ ok: true }));
