/**
 * flow-ts 的界面组件，建在 vue-tsx-pro-ui 上：按字段清单渲染单据（useFlowForm、manifestSchema、manifestAccess），
 * 线上与表单里两种值的互换（toFormValues、fromFormValues）；流程图（processDiagram）、设计器的环节设置（NodePanel）、表单权限矩阵（AccessMatrix）与表单设计器（FormDesigner）。
 */
export { AccessMatrix, type AccessMatrixProps } from './designer/AccessMatrix';
export { accessRows, without, type AccessRow, type DefinitionEdit } from './designer/form-access';
export { FormDesigner, type FormDesignerProps } from './designer/FormDesigner';
export {
  FIELD_TYPES,
  fieldTypeLabel,
  freshName,
  insertField,
  orderFields,
  removeField,
  renameField,
  updateField,
} from './designer/form-fields';
export { NodePanel, type NodePanelProps } from './designer/NodePanel';
export {
  processDiagram,
  renderStep,
  stepLabel,
  type FlowItem,
  type ProcessProgress,
  type StepItem,
  type StepState,
} from './diagram/process-diagram';
export { fromFormValues, toFormValues } from './form/form-values';
export { manifestSchema } from './form/manifest-schema';
export {
  manifestAccess,
  useFlowForm,
  type FlowFormOptions,
  type ManifestAccessInput,
} from './form/useFlowForm';
