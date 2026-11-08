/** Go 的 WebAssembly 启动器（go-runtime.js） */
export declare class Go {
  argv: string[];
  env: Record<string, string>;
  exit: (code: number) => void;
  readonly importObject: WebAssembly.Imports;
  exited: boolean;
  run(instance: WebAssembly.Instance): Promise<void>;
}
