import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DataImportProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Export from './demo/Export.tsx?demo';
import Parts from './demo/Parts.tsx?demo';

export const meta = {
  title: 'DataImport 数据导入',
  description:
    '批量导入：上传 Excel 或 CSV、对应列、逐行校验与预览（有错的格子就地改）、确认导入；Excel 的读写在 @vue-tsx-pro/ui/xlsx（分组表头导出成合并单元格、读取时展开合并）。',
  order: 6,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports={
      "import { DataImport } from '@vue-tsx-pro/ui/patterns';\nimport { exportXlsx, readXlsx } from '@vue-tsx-pro/ui/xlsx';"
    }
  >
    <Example id="parts" title="零件批量导入" demo={Parts}>
      先点“下载模板”得到一份示例（故意留了两处错），再把它拖进来。<Code>fields</Code>{' '}
      是要导入的字段：<Code>label</Code> 与 <Code>aliases</Code>{' '}
      用来自动对上文件里的列（“料号”“数量（件）”都认得），可以在“对应列”一步改；必填的字段没对上时不能往下走。
      <Code>schema</Code> 是一行的 zod
      对象，逐行解析，错误标在对应的格子上（悬停、读屏都能知道原因）；有错的格子可以直接改，改完重新校验，“只看有错的行”筛出要处理的。
      <Code>onImport</Code> 拿到通过校验的行（schema 解析后的值）。<Code>parse</Code>{' '}
      读文件：不写时读 CSV（组件库自带的 <Code>readCsvFile</Code>），Excel 用{' '}
      <Code>@vue-tsx-pro/ui/xlsx</Code> 的 <Code>readXlsx</Code>
      ：合并单元格展开到每一格、多行表头连成“组 / 列”（
      <Code>headerRows</Code>）、单元格里有换行的可以拆成几行（<Code>splitLines</Code>）。
    </Example>
    <Example id="export" title="导出 Excel" demo={Export}>
      <Code>exportXlsx(文件名, 工作表)</Code> 用 DataTable 的列定义导出：分组表头（
      <Code>groups</Code>，同 <Code>columnGroups</Code>
      ）导出成两行，组标题横向合并、没分组的列上下合并，表头冻结；金额、数量、日期是真正的数值与日期，带
      Excel 的数字格式（按列的 <Code>format.scale</Code> 换算成万元），状态写名字，
      <Code>summary: 'sum'</Code> 的列底部多一行合计。<Code>tableToXlsx</Code>{' '}
      只生成文件内容（上传到服务器、存附件）。ExcelJS 是可选的 peer 依赖：用到{' '}
      <Code>@vue-tsx-pro/ui/xlsx</Code> 时安装 <Code>exceljs</Code>。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
