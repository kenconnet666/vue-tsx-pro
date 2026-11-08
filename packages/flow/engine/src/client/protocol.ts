/**
 * 客户端与端点之间的消息（docs/decisions/0009 第 2 节）：一次调用是方法名加参数，回来的是值或错误。
 * 参数与值都写成 json-wire 的 typed JSON 文字（stringifyWire）：Decimal、日期、时刻还原得回来，
 * 传输（Worker 的消息端口、HTTP）只管把文字送过去。
 */

/** 一次调用：方法名（`todo`、`drafts.save`……）与参数（参数数组的 typed JSON 文字） */
export interface FlowRequest {
  readonly method: string;
  readonly args: string;
}

/** 调用的结果：值（typed JSON 文字），或错误（引擎的错误带 code，details 是 typed JSON 文字） */
export type FlowResponse =
  | { readonly ok: true; readonly value: string }
  | {
      readonly ok: false;
      readonly error: { readonly code: string; readonly message: string; readonly details: string };
    };

/** 传输：把调用送到端点、拿回结果；能推送的传输还能订阅“数据变了” */
export interface FlowTransport {
  call(request: FlowRequest): Promise<FlowResponse>;
  /** 订阅数据变了（有人执行了命令）；返回取消订阅的函数。不能推送的传输不给 */
  subscribe?(listener: () => void): () => void;
}
