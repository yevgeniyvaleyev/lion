/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
import { searchParamSerializer } from './serialize-search-params.js';
import './typedef.js';

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;

class LionCache {
  constructor() {
    this.expiration = +new Date() + HOUR;
    /**
     * @type {{[url: string]: CacheConfig }}
     */
    this.cacheConfig = {};

    /**
     * @type {{[url: string]: {date: number, data: object} }}
     */
    this.cacheObject = {};
  }

  /**
   * Store an item in the cache
   * @param {string} url key by which the cache is stored
   * @param {object} data the cached object
   */
  set(url, data) {
    this._validateCache();
    this.cacheObject[url] = {
      date: +new Date(),
      data,
    };
  }

  /**
   * Retrieve an item from the cache
   * @param {string} url key by which the cache is stored
   * @param {number} timeToLive maximum time to allow cache to live
   */
  get(url, timeToLive) {
    this._validateCache();

    const cacheResult = this.cacheObject[url];
    if (!cacheResult) {
      return false;
    }
    const cacheAge = +new Date() - cacheResult.date;

    if (timeToLive !== null && cacheAge > timeToLive) {
      return false;
    }
    return cacheResult.data;
  }

  /**
   * Delete all items from the cache that contain the given url
   * @param {string} url key by which the cache is stored
   */
  delete(url) {
    this._validateCache();

    Object.keys(this.cacheObject).forEach(key => {
      if (key.indexOf(url) > -1) {
        delete this.cacheObject[key];
      }
    });
  }

  /**
   * Delete all items from the cache that match given regex
   * @param {RegExp} regex an regular expression to match cache entries
   */
  deleteMatched(regex) {
    this._validateCache();

    Object.keys(this.cacheObject).forEach(key => {
      if (regex.test(key)) {
        delete this.cacheObject[key];
      }
    });
  }

  /**
   * Validate cache on each call to the Cache
   * When the expiration date has passed, the cacheObject will be replaced by an
   * empty object
   */
  _validateCache() {
    if (+new Date() > this.expiration) {
      // @ts-ignore
      this.cacheObject = {};
    }
    return true;
  }
}

let caches = {};

/**
 * Returns the active cache instance for the current session
 * @param {string} cacheIdentifier usually the refreshToken of the owner of the cache
 */
const getCache = cacheIdentifier => {
  if (caches[cacheIdentifier] && caches[cacheIdentifier]._validateCache()) {
    return caches[cacheIdentifier];
  }
  // invalidate old caches
  caches = {};
  // create new cache
  caches[cacheIdentifier] = new LionCache();
  return caches[cacheIdentifier];
};

/**
 * @param {CacheOptions} options Options to match cache
 * @param {boolean} isGlobalOptions only available per action (get, post etc)
 * @returns {ValidatedCacheOptions}
 */
export const validateOptions = (
  {
    useCache = 'never',
    methods = ['get'],
    timeToLive,
    invalidateUrls,
    invalidateUrlsRegex,
    requestIdentificationFn,
  },
  isGlobalOptions = false,
) => {
  // validate 'cache'
  if (!(useCache === 'always' || useCache === 'never')) {
    throw new Error('Property `useCache` should be `always` or `never`');
  }

  if (methods[0] !== 'get' || methods.length !== 1) {
    throw new Error('Functionality to use cache on anything except "get" is not yet supported');
  }

  // validate 'timeToLive', default 1 hour
  if (timeToLive === undefined) {
    timeToLive = 0;
  }
  if (Number.isNaN(parseInt(String(timeToLive), 10))) {
    throw new Error('Property `timeToLive` must be of type `number`');
  }
  // validate 'invalidateUrls', must be an `Array` or `falsy`
  if (invalidateUrls) {
    if (isGlobalOptions) {
      throw new Error(
        'Property `invalidateUrls` can be applied only to config per action (get, post etc)',
      );
    }
    if (!Array.isArray(invalidateUrls)) {
      throw new Error('Property `invalidateUrls` must be of type `Array` or `falsy`');
    }
  }
  // validate 'invalidateUrlsRegex', must be an regex expression or `falsy`
  if (invalidateUrlsRegex) {
    if (isGlobalOptions) {
      throw new Error(
        'Property `invalidateUrlsRegex` can be applied only to config per action (get, post etc)',
      );
    }
    if (!(invalidateUrlsRegex instanceof RegExp)) {
      throw new Error('Property `invalidateUrlsRegex` must be of type `RegExp` or `falsy`');
    }
  }
  // validate 'requestIdentificationFn', default is url + searchParams
  if (requestIdentificationFn) {
    if (typeof requestIdentificationFn !== 'function') {
      throw new Error('Property `requestIdentificationFn` must be of type `function` or `falsy`');
    }
  } else {
    requestIdentificationFn = /** @param {any} data */ (
      { url, params },
      searchParamsSerializer,
    ) => {
      const serializedParams = searchParamsSerializer(params);
      return serializedParams ? `${url}?${serializedParams}` : url;
    };
  }

  return {
    useCache,
    methods,
    timeToLive,
    invalidateUrls,
    invalidateUrlsRegex,
    requestIdentificationFn,
  };
};

/**
 * Request interceptor to return relevant cached requests
 * @param {function(): string} getCacheIdentifier used to invalidate cache if identifier is changed
 * @param {GlobalCacheOptions} globalCacheOptions
 */
export const lionCacheRequestInterceptorFactory = (getCacheIdentifier, globalCacheOptions) => {
  const validatedInitialLionCacheOptions = validateOptions(globalCacheOptions, true);

  return /** @param {CacheRequest} cacheRequest */ cacheRequest => {
    const { method, status, statusText, headers } = cacheRequest;

    /** @type {any} */
    let actionCacheOptions = {};

    try {
      actionCacheOptions =
        cacheRequest.lionCacheOptions &&
        validateOptions({
          ...validatedInitialLionCacheOptions,
          ...cacheRequest.lionCacheOptions,
        });
    } catch (e) {
      // We need console.error here to show error somehow since Errors are not emitted from Axios
      // eslint-disable-next-line no-console
      console.error(e.message);
    }

    /** @type {ValidatedCacheOptions} */
    const lionCacheOptions = {
      ...validatedInitialLionCacheOptions,
      ...actionCacheOptions,
    };

    // don't use cache if 'cache' === 'never'
    if (lionCacheOptions.useCache === 'never') {
      return cacheRequest;
    }

    const cacheId = lionCacheOptions.requestIdentificationFn(cacheRequest, searchParamSerializer);

    // cacheIdentifier is used to bind the cache to the current session
    const currentCache = getCache(getCacheIdentifier());
    const cacheResponse = currentCache.get(cacheId, lionCacheOptions.timeToLive);

    // don't use cache if the request method is not part of the configs methods
    if (lionCacheOptions.methods.indexOf(method) === -1) {
      // If it's NOT one of the config.methods, invalidate caches
      currentCache.delete(cacheId);
      // also invalidate caches matching to ingCacheOptions
      if (lionCacheOptions.invalidateUrls) {
        lionCacheOptions.invalidateUrls.forEach(
          /** @type {string} */ invalidateUrl => {
            currentCache.delete(invalidateUrl);
          },
        );
      }
      // also invalidate caches matching to invalidateUrlsRegex
      if (lionCacheOptions.invalidateUrlsRegex) {
        currentCache.deleteMatched(lionCacheOptions.invalidateUrlsRegex);
      }

      return cacheRequest;
    }

    if (cacheResponse) {
      // Return cached response
      // eslint-disable-next-line no-param-reassign
      cacheRequest.adapter = () => {
        // eslint-disable-next-line no-param-reassign
        if (!cacheRequest.lionCacheOptions) {
          cacheRequest.lionCacheOptions = { useCache: 'never' };
        }
        // @ts-ignore 'fromCache' is needed only for internal communication between request and response interceptors
        cacheRequest.lionCacheOptions.fromCache = true;
        return Promise.resolve({
          data: cacheResponse,
          status,
          statusText,
          headers,
          config: cacheRequest,
          request: cacheRequest,
        });
      };
      return cacheRequest;
    }

    return cacheRequest;
  };
};

/**
 * Response interceptor to cache relevant requests
 * @param {function(): string} getCacheIdentifier used to invalidate cache if identifier is changed
 * @param {GlobalCacheOptions} globalCacheOptions
 */
export const lionCacheResponseInterceptorFactory = (getCacheIdentifier, globalCacheOptions) => {
  const validatedInitialLionCacheOptions = validateOptions(globalCacheOptions, true);

  /**
   * Axios response https://github.com/axios/axios#response-schema
   */
  return /** @param {CacheResponse} cacheResponse */ cacheResponse => {
    /** @type {any} */
    let actionCacheOptions = {};

    try {
      actionCacheOptions =
        cacheResponse.config.lionCacheOptions &&
        validateOptions({
          ...validatedInitialLionCacheOptions,
          ...cacheResponse.config.lionCacheOptions,
        });
    } catch (e) {
      // We need console.error here to show error somehow since Errors are not emitted from Axios
      // eslint-disable-next-line no-console
      console.error(e.message);
    }

    const lionCacheOptions = {
      ...validatedInitialLionCacheOptions,
      ...actionCacheOptions,
    };

    if (!getCacheIdentifier()) {
      throw new Error(`getCacheIdentifier returns falsy`);
    }

    // @ts-ignore 'fromCache' is needed only for internal communication between request and response interceptors
    const isAlreadyFromCache = !!lionCacheOptions.fromCache;
    // caching all responses with not default `timeToLive`
    const isCacheActive = lionCacheOptions.timeToLive > 0;

    if (isAlreadyFromCache || !isCacheActive) {
      return cacheResponse;
    }

    // if the request is one of the options.methods; store response in cache
    if (lionCacheOptions.methods.indexOf(cacheResponse.config.method) > -1) {
      // string that identifies cache entry
      const cacheId = lionCacheOptions.requestIdentificationFn(
        cacheResponse.config,
        searchParamSerializer,
      );

      // store the response data in the cache
      getCache(getCacheIdentifier()).set(cacheId, cacheResponse.data);
    } else {
      // don't store in cache if the request method is not part of the configs methods
      return cacheResponse;
    }

    return cacheResponse;
  };
};
