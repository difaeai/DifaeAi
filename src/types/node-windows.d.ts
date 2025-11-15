declare module "node-windows" {
  interface ServiceEnvironment {
    name: string;
    value: string;
  }

  interface ServiceConfig {
    name: string;
    description?: string;
    script: string;
    env?: ServiceEnvironment[];
    wait?: number;
    grow?: number;
    maxRetries?: number;
    workingDirectory?: string;
    args?: string[];
  }

  type ServiceEvent =
    | "install"
    | "alreadyinstalled"
    | "invalidinstallation"
    | "start"
    | "stop"
    | "uninstall"
    | "error";

  class Service {
    constructor(config: ServiceConfig);
    on(event: ServiceEvent, handler: (...args: any[]) => void): this;
    install(): void;
    uninstall(): void;
    start(): void;
    stop(): void;
    exists: boolean;
  }

  export { Service, ServiceConfig };
}
