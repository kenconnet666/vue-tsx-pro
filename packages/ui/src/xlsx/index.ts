/**
 * Excel 读写（子路径 `@zerodep-dev/vue-tsx-pro-ui/xlsx`）：导出带分组表头、数字格式的 .xlsx，读取时展开合并单元格、连起多行表头。
 * 依赖可选的 peer exceljs，用到这个子路径时安装。见 workbook.ts。
 *
 *   import { exportXlsx, readXlsx } from '@zerodep-dev/vue-tsx-pro-ui/xlsx';
 */
export {
  exportXlsx,
  readXlsx,
  tableToXlsx,
  type XlsxExportOptions,
  type XlsxReadOptions,
  type XlsxSheet,
} from './workbook';
