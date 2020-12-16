export type Headers = {
  [name: string]: string;
};

export type Options = {
  url?: string;
  method?:
    | 'get'
    | 'post'
    | 'put'
    | 'patch'
    | 'delete'
    | 'options'
    | 'head'
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD';
  headers?: Headers;
  body?: FormData | string | Object;
  responseType?: 'text' | 'json' | 'stream' | 'blob' | 'arrayBuffer' | 'formData' | 'stream';
  params?: Record<string, any> | URLSearchParams;
  paramsSerializer?: (params: Options['params']) => string;
  withCredentials?: boolean;
  auth?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  validateStatus?: (status: number) => boolean;
  transformRequest?: Array<(body: any, headers: Headers) => any | void>;
  baseURL?: string;
  fetch?: typeof window.fetch;
  data?: any;
};

export type Response<T> = {
  status: number;
  statusText: string;
  config: Options;
  data: T;
  headers: Headers;
  redirect: boolean;
  url: string;
  type: ResponseType;
  body: ReadableStream<Uint8Array> | null;
  bodyUsed: boolean;
};

export type BodylessMethod = <T = any>(url: string, config?: Options) => Promise<Response<T>>;
export type BodyMethod = <T = any>(
  url: string,
  body?: any,
  config?: Options,
) => Promise<Response<T>>;
