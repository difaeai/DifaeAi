declare module "formidable" {
  export interface File {
    filepath: string;
    originalFilename?: string | null;
    [key: string]: unknown;
  }

  export interface Files {
    [key: string]: File | File[] | undefined;
  }

  export interface Fields {
    [key: string]: string | string[] | undefined;
  }

  export interface Formidable {
    parse(
      request: any,
      callback: (err: unknown, fields: Fields, files: Files) => void,
    ): void;
  }

  function formidable(options?: Record<string, unknown>): Formidable;
  export default formidable;
}
