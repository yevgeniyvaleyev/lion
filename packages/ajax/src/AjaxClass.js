import axios from 'redaxios';
import {
  cancelInterceptorFactory,
  cancelPreviousOnNewRequestInterceptorFactory,
  addAcceptLanguageHeaderInterceptorFactory,
} from './interceptors.js';
import { jsonPrefixTransformerFactory } from './transformers.js';

/**
 * `AjaxClass` creates the singleton instance {@link:ajax}. It is a promise based system for
 * fetching data, based on [axios](https://github.com/axios/axios).
 * @typedef {Object} AjaxOptions
 * @property {string|null} lang
 * @property {boolean} languageHeader
 * @property {boolean} cancelable
 * @property {boolean} cancelPreviousOnNewRequest
 * @property {string} [jsonPrefix]
 *
 * @typedef {import('../types/redaxiosTypes').Options & AjaxOptions} AjaxConfig
 */
export class AjaxClass {
  /**
   * @param {AjaxConfig} [config] configuration for the AjaxClass instance
   */
  constructor(config) {
    this.__config = {
      lang: document.documentElement.getAttribute('lang'),
      languageHeader: true,
      cancelable: false,
      cancelPreviousOnNewRequest: false,
      ...config,
    };
    this.proxy = axios.create(this.__config);
    this.__setupInterceptors();

    this.requestInterceptors = [];
    this.requestErrorInterceptors = [];
    this.responseErrorInterceptors = [];
    this.responseInterceptors = [];

    this.requestDataTransformers = [];
    this.requestDataErrorTransformers = [];
    this.responseDataErrorTransformers = [];
    this.responseDataTransformers = [];

    this.__isInterceptorsSetup = false;

    if (this.__config.languageHeader) {
      this.requestInterceptors.push(addAcceptLanguageHeaderInterceptorFactory(this.__config.lang));
    }

    if (this.__config.cancelable) {
      this.requestInterceptors.push(cancelInterceptorFactory(this));
    }

    if (this.__config.cancelPreviousOnNewRequest) {
      this.requestInterceptors.push(cancelPreviousOnNewRequestInterceptorFactory());
    }

    if (this.__config.jsonPrefix) {
      const transformer = jsonPrefixTransformerFactory(this.__config.jsonPrefix);
      this.responseDataTransformers.push(transformer);
    }
  }

  /**
   * Sets the config for the instance
   * @param {AjaxConfig} config configuration for the AjaxClass instance
   */
  set options(config) {
    this.__config = config;
  }

  get options() {
    return this.__config;
  }

  /**
   * Dispatches a request
   * @see https://github.com/axios/axios
   * @param {string} url
   * @param {{[key:string]: ?}} [config] the config specific for this request
   * @returns {?}
   */
  request(url, config) {
    return this.proxy.request.apply(this, [url, { ...this.__config, ...config }]);
  }

  /** @param {string} msg */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  cancel(msg) {}

  /**
   * Dispatches a {@link AxiosRequestConfig} with method 'get' predefined
   * @param {string} url the endpoint location
   * @param {{[key:string]: ?}} [config] the config specific for this request
   * @returns {?}
   */
  get(url, config) {
    return this.proxy.get.apply(this, [url, { ...this.__config, ...config }]);
  }

  /**
   * Dispatches a {@link AxiosRequestConfig} with method 'delete' predefined
   * @param {string} url the endpoint location
   * @param {{[key:string]: ?}} [config] the config specific for this request
   * @returns {?}
   */
  delete(url, config) {
    return this.proxy.delete.apply(this, [url, { ...this.__config, ...config }]);
  }

  /**
   * Dispatches a {@link AxiosRequestConfig} with method 'head' predefined
   * @param {string} url the endpoint location
   * @param {{[key:string]: ?}} [config] the config specific for this request
   * @returns {?}
   */
  head(url, config) {
    return this.proxy.head.apply(this, [url, { ...this.__config, ...config }]);
  }

  /**
   * Dispatches a {@link AxiosRequestConfig} with method 'options' predefined
   * @param {string} url the endpoint location
   * @param {{[key:string]: ?}} [config] the config specific for this request
   * @returns {?}
   */
  // options(url, config) {
  //   return this.proxy.options.apply(this, [url, { ...this.__config, ...config }]);
  // }

  /**
   * Dispatches a {@link AxiosRequestConfig} with method 'post' predefined
   * @param {string} url the endpoint location
   * @param {Object} [data] the data to be sent to the endpoint
   * @param {{[key:string]: ?}} [config] the config specific for this request
   * @returns {?}
   */
  post(url, data, config) {
    return this.proxy.post.apply(this, [url, data, { ...this.__config, ...config }]);
  }

  /**
   * Dispatches a {@link AxiosRequestConfig} with method 'put' predefined
   * @param {string} url the endpoint location
   * @param {Object} [data] the data to be sent to the endpoint
   * @param {{[key:string]: ?}} [config] the config specific for this request
   * @returns {?}
   */
  put(url, data, config) {
    return this.proxy.put.apply(this, [url, data, { ...this.__config, ...config }]);
  }

  /**
   * Dispatches a {@link AxiosRequestConfig} with method 'patch' predefined
   * @see https://github.com/axios/axios (Request Config)
   * @param {string} url the endpoint location
   * @param {Object} [data] the data to be sent to the endpoint
   * @param {Object} [config] the config specific for this request.
   * @returns {?}
   */
  patch(url, data, config) {
    return this.proxy.patch.apply(this, [url, data, { ...this.__config, ...config }]);
  }

  __setupInterceptors() {
    this.proxy.interceptors.request.use(
      config => {
        // const configWithTransformers = this.__setupTransformers(config);
        return this.requestInterceptors.reduce((c, i) => {
          console.log(i);
          return i(c);
        }, config);
      },
      /** @param {Error} error */ error => {
        this.requestErrorInterceptors.forEach(i => i(error));
        return Promise.reject(error);
      },
    );

    this.proxy.interceptors.response.use(
      response => this.responseInterceptors.reduce((r, i) => i(r), response),
      /** @param {Error} error */ error => {
        this.responseErrorInterceptors.forEach(i => i(error));
        return Promise.reject(error);
      },
    );
  }

  // /** @param {{[key:string]: ?}} config */
  // __setupTransformers(config) {
  //   const axiosTransformRequest = config.transformRequest[0];
  //   const axiosTransformResponse = config.transformResponse[0];
  //   return {
  //     ...config,
  //     /**
  //      * @param {string} data
  //      * @param {{[key:string]: ?}} headers
  //      */
  //     transformRequest: (data, headers) => {
  //       try {
  //         const ourData = this.requestDataTransformers.reduce((d, t) => t(d, headers), data);
  //         // axios does a lot of smart things with the request that people rely on
  //         // and must be the last request data transformer to do this job
  //         return axiosTransformRequest(ourData, headers);
  //       } catch (error) {
  //         this.requestDataErrorTransformers.forEach(t => t(error));
  //         throw error;
  //       }
  //     },
  //     /**
  //      * @param {string} data
  //      */
  //     transformResponse: data => {
  //       try {
  //         // axios does a lot of smart things with the response that people rely on
  //         // and must be the first response data transformer to do this job
  //         const axiosData = axiosTransformResponse(data);
  //         return this.responseDataTransformers.reduce((d, t) => t(d), axiosData);
  //       } catch (error) {
  //         this.responseDataErrorTransformers.forEach(t => t(error));
  //         throw error;
  //       }
  //     },
  //   };
  // }
}
