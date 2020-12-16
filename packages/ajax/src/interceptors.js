// @ts-ignore no types for bundled-es-modules/axios
import axios from 'redaxios';

/**
 * @param {string} [lang]
 */
export function addAcceptLanguageHeaderInterceptorFactory(lang) {
  return /** @param {{[key:string]: ?}} config */ config => {
    const result = config;
    if (typeof lang === 'string' && lang !== '') {
      if (typeof result.headers !== 'object') {
        result.headers = {};
      }
      const withLang = { headers: { 'Accept-Language': lang, ...result.headers } };
      return { ...result, ...withLang };
    }
    return result;
  };
}

/**
 * @param {import('./AjaxClass').AjaxClass} ajaxInstance
 */
export function cancelInterceptorFactory(ajaxInstance) {
  /** @type {unknown[]} */
  const cancelSources = [];
  return /** @param {{[key:string]: ?}} config */ config => {
    const source = axios.CancelToken.source();
    cancelSources.push(source);
    /* eslint-disable-next-line no-param-reassign */
    ajaxInstance.cancel = (message = 'Operation canceled by the user.') => {
      cancelSources.forEach(s => s.cancel(message));
    };
    return { ...config, cancelToken: source.token };
  };
}

/**
 */
export function cancelPreviousOnNewRequestInterceptorFactory() {
  let prevCancelSource;
  return /** @param {{[key:string]: ?}} config */ config => {
    if (prevCancelSource) {
      prevCancelSource.cancel('Concurrent requests not allowed.');
    }
    const source = axios.CancelToken.source();
    prevCancelSource = source;
    return { ...config, cancelToken: source.token };
  };
}
