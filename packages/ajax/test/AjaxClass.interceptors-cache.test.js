import { expect } from '@open-wc/testing';
import sinon, { spy } from 'sinon';
import '../src/typedef-cache.js';

import { cacheRequestInterceptorFactory, cacheResponseInterceptorFactory, ajax } from '../index.js';

describe('ajax cache', function describeLibCache() {
  /** @type {number | undefined} */
  let cacheId;
  /** @type {import('sinon').SinonFakeServer} */
  let server;
  /** @type {() => string} */
  let getCacheIdentifier;

  const newCacheId = () => {
    if (!cacheId) {
      cacheId = 1;
    } else {
      cacheId += 1;
    }
    return cacheId;
  };

  /**
   * @param {ajax} ajaxInstance
   * @param {CacheOptions} options
   */
  const addCacheInterceptors = (ajaxInstance, options) => {
    const requestInterceptorIndex =
      ajaxInstance.requestInterceptors.push(
        cacheRequestInterceptorFactory(getCacheIdentifier, options),
      ) - 1;

    const responseInterceptorIndex =
      ajaxInstance.responseInterceptors.push(
        cacheResponseInterceptorFactory(getCacheIdentifier, options),
      ) - 1;

    return {
      requestInterceptorIndex,
      responseInterceptorIndex,
    };
  };

  /**
   * @param {ajax} ajaxInstance
   * @param {{requestInterceptorIndex: number, responseInterceptorIndex: number}} indexes
   */
  const removeCacheInterceptors = (
    ajaxInstance,
    { requestInterceptorIndex, responseInterceptorIndex },
  ) => {
    ajaxInstance.requestInterceptors.splice(requestInterceptorIndex, 1);
    ajaxInstance.responseInterceptors.splice(responseInterceptorIndex, 1);
  };

  beforeEach(() => {
    getCacheIdentifier = () => String(cacheId);
    server = sinon.fakeServer.create({ autoRespond: true });

    server.respondWith(/\/test/, [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({ some: 'data' }),
    ]);
  });

  afterEach(() => {
    server.restore();
  });

  describe('Original ajax instance', () => {
    it('allows direct ajax calls without cache interceptors configured', () => {
      return ajax
        .get('/test')
        .then(() => {
          expect(server.requests.length).to.equal(1);
        })
        .then(() => ajax.get('/test'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        });
    });

    it('preserves ajax configuration', () => {
      newCacheId();

      /** @type {CacheOptions} */
      const cacheParams = {
        useCache: true,
        methods: ['get'],
        timeToLive: 3600001,
        requestIdentificationFn: () => '',
      };
      const indexes = addCacheInterceptors(ajax, cacheParams);
      const ajaxOptions = ajax.options;
      const ajaxProxyGetSpy = spy(ajax.proxy, 'get');

      return ajax
        .get('/test')
        .then(() => {
          const configArg = ajaxProxyGetSpy.args[0][1];
          expect(ajaxProxyGetSpy).to.be.calledOnceWith('/test');
          expect(configArg).to.eql(ajaxOptions);
        })
        .finally(() => {
          ajaxProxyGetSpy.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });
  });

  describe('Cache config validation', () => {
    it('validates `useCache`', () => {
      newCacheId();
      const test = () => {
        const indexes = addCacheInterceptors(ajax, {
          // @ts-ignore needed for test
          useCache: 'fakeUseCacheType',
        });
        removeCacheInterceptors(ajax, indexes);
      };
      expect(test).to.throw();
    });

    it('validates property `timeToLive` throws if not type `number`', () => {
      newCacheId();
      expect(() => {
        const indexes = addCacheInterceptors(ajax, {
          useCache: true,
          // @ts-ignore needed for test
          timeToLive: '',
        });
        removeCacheInterceptors(ajax, indexes);
      }).to.throw();
    });

    it('validates cache identifier function', () => {
      // @ts-ignore needed for test
      cacheId = '';

      const indexes = addCacheInterceptors(ajax, { useCache: true });

      return ajax.get('/test').catch(
        /** @param {Error} err */ err => {
          expect(err.message).to.equal('getCacheIdentifier returns falsy');

          removeCacheInterceptors(ajax, indexes);
        },
      );
    });

    it("throws when using methods other than `['get']`", () => {
      newCacheId();

      expect(() => {
        const indexes = addCacheInterceptors(ajax, {
          useCache: true,
          methods: ['get', 'post'],
        });
        removeCacheInterceptors(ajax, indexes);
      }).to.throw(/not yet supported/);
    });

    it('throws error when requestIdentificationFn is not a function', () => {
      newCacheId();

      expect(() => {
        const indexes = addCacheInterceptors(ajax, {
          useCache: true,
          // @ts-ignore needed for test
          requestIdentificationFn: 'not a function',
        });
        removeCacheInterceptors(ajax, indexes);
      }).to.throw(/Property `requestIdentificationFn` must be of type `function` or `falsy`/);
    });
  });

  describe('Cached responses', () => {
    it('returns the cached object on second call with `useCache: true`', () => {
      newCacheId();

      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 100,
      });
      const ajaxGetSpy = sinon.spy(ajax, 'get');

      return ajax
        .get('/test')
        .then(() => {
          expect(ajaxGetSpy.calledOnce).to.be.true;
          expect(ajaxGetSpy.calledWith('/test')).to.be.true;
        })
        .then(() => ajax.get('/test'))
        .then(() => {
          expect(server.requests.length).to.equal(1);
        })
        .finally(() => {
          ajaxGetSpy.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('all calls with non-default `timeToLive` are cached proactively', () => {
      newCacheId();

      const indexes = addCacheInterceptors(ajax, {
        useCache: false,
        timeToLive: 100,
      });
      const ajaxGetSpy = sinon.spy(ajax, 'get');

      return ajax
        .get('/test')
        .then(() => {
          expect(ajaxGetSpy.calledOnce).to.be.true;
          expect(ajaxGetSpy.calledWith('/test')).to.be.true;
        })
        .then(() => {
          expect(server.requests.length).to.equal(1);
        })
        .then(() => ajax.get('/test'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .then(() =>
          ajax.get('/test', {
            cacheOptions: {
              useCache: true,
            },
          }),
        )
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .finally(() => {
          ajaxGetSpy.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('returns the cached object on second call with `useCache: true`, with querystring parameters', () => {
      newCacheId();

      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 100,
      });

      const ajaxGetSpy = sinon.spy(ajax, 'get');

      return ajax
        .get('/test', {
          params: {
            q: 'test',
            page: 1,
          },
        })
        .then(() => {
          expect(ajaxGetSpy.calledOnce).to.be.true;
          expect(ajaxGetSpy.calledWith('/test')).to.be.true;
        })
        .then(() =>
          ajax.get('/test', {
            params: {
              q: 'test',
              page: 1,
            },
          }),
        )
        .then(() => {
          expect(server.requests.length).to.equal(1);
        })
        .then(() =>
          // a request with different param should not be cached
          ajax.get('/test', {
            params: {
              q: 'test',
              page: 2,
            },
          }),
        )
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .finally(() => {
          ajaxGetSpy.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('uses cache when inside `timeToLive: 5000` window', () => {
      newCacheId();
      const clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });

      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 5000,
      });
      const ajaxGetSpy = sinon.spy(ajax, 'get');

      server.respondWith(/\/test-ttl-5000/, [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({ some: 'data-ttl-5000' }),
      ]);

      return ajax
        .get('/test-ttl-5000')
        .then(() => {
          expect(ajaxGetSpy.calledOnce).to.be.true;
          expect(ajaxGetSpy.calledWith('/test-ttl-5000')).to.be.true;
          expect(server.requests.length).to.equal(1);
        })
        .then(() => {
          clock.tick(4900);
        })
        .then(() => ajax.get('/test-ttl-5000'))
        .then(() => {
          expect(server.requests.length).to.equal(1);
          clock.tick(5100);
        })
        .then(() => ajax.get('/test-ttl-5000'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .finally(() => {
          ajaxGetSpy.restore();
          clock.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('uses custom requestIdentificationFn when passed', () => {
      newCacheId();

      const customRequestIdFn = /** @type {RequestIdentificationFn} */ (request, serializer) => {
        return `${request.url}-${request.headers['x-id']}?${serializer(request.params)}`;
      };
      const reqIdSpy = sinon.spy(customRequestIdFn);
      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        requestIdentificationFn: reqIdSpy,
      });

      return ajax
        .get('/test', { headers: { 'x-id': '1' } })
        .then(() => {
          expect(reqIdSpy.calledOnce);
          expect(reqIdSpy.returnValues[0]).to.equal(`/test-1?`);
        })
        .finally(() => {
          removeCacheInterceptors(ajax, indexes);
        });
    });
  });

  describe('Cache invalidation', () => {
    it('previously cached data has to be invalidated when regex invalidation rule triggered', () => {
      newCacheId();

      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 1000,
        invalidateUrlsRegex: /foo/gi,
      });

      server.respondWith(/\/foo-request-1/, xhr => {
        xhr.respond(200, { 'Content-Type': 'application/json' }, '{}');
      });

      server.respondWith(/\/foo-request-2/, xhr => {
        xhr.respond(200, { 'Content-Type': 'application/json' }, '{}');
      });

      return ajax
        .get('/test')
        .then(() => ajax.get('/test'))
        .then(() => {
          expect(server.requests.length).to.equal(1);
        })
        .then(() => ajax.get('/foo-request-1'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .then(() => ajax.get('/foo-request-1'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .then(() => ajax.get('/foo-request-2'))
        .then(() => {
          expect(server.requests.length).to.equal(3);
        })
        .then(() => ajax.get('/foo-request-2'))
        .then(() => {
          expect(server.requests.length).to.equal(3);
        })
        .then(() => ajax.post('/test', {}))
        .then(() => {
          expect(server.requests.length).to.equal(4);
        })
        .then(() => ajax.get('/foo-request-1'))
        .then(() => {
          expect(server.requests.length).to.equal(5);
        })
        .then(() => ajax.get('/foo-request-2'))
        .then(() => {
          expect(server.requests.length).to.equal(6);
        })
        .finally(() => {
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('previously cached data has to be invalidated when regex invalidation rule triggered and urls are nested', () => {
      newCacheId();

      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 1000,
        invalidateUrlsRegex: /posts/gi,
      });

      server.respondWith(/^\/posts$/, xhr => {
        xhr.respond(200, { 'Content-Type': 'application/json' }, '{}');
      });

      server.respondWith(/^\/posts\/1$/, xhr => {
        xhr.respond(200, { 'Content-Type': 'application/json' }, '{}');
      });

      return ajax
        .get('/test')
        .then(() => ajax.get('/test'))
        .then(() => {
          expect(server.requests.length).to.equal(1);
        })
        .then(() => ajax.get('/posts'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .then(() => ajax.get('/posts'))
        .then(() => {
          // no new requests, cached
          expect(server.requests.length).to.equal(2);
        })
        .then(() => ajax.get('/posts/1'))
        .then(() => {
          expect(server.requests.length).to.equal(3);
        })
        .then(() => ajax.get('/posts/1'))
        .then(() => {
          // no new requests, cached
          expect(server.requests.length).to.equal(3);
        })
        .then(() =>
          // cleans cache for defined urls
          ajax.post('/test', {}),
        )
        .then(() => {
          expect(server.requests.length).to.equal(4);
        })
        .then(() => ajax.get('/posts'))
        .then(() => {
          // new requests, cache is cleaned
          expect(server.requests.length).to.equal(5);
        })
        .then(() => ajax.get('/posts/1'))
        .then(() => {
          // new requests, cache is cleaned
          expect(server.requests.length).to.equal(6);
        })
        .finally(() => {
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('deletes cache after one hour', () => {
      newCacheId();
      const clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });

      const ajaxGetSpy = sinon.spy(ajax, 'get');
      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 1000 * 60 * 60,
      });

      server.respondWith(/\/test-hour/, [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({ some: 'data-hour' }),
      ]);

      return ajax
        .get('/test-hour')
        .then(() => {
          expect(ajaxGetSpy.calledOnce).to.be.true;
          expect(ajaxGetSpy.calledWith('/test-hour')).to.be.true;
          expect(server.requests.length).to.equal(1);
        })
        .then(() => {
          clock.tick(1000 * 60 * 59); // 0:59 hour
        })
        .then(() => ajax.get('/test-hour'))
        .then(() => {
          expect(server.requests.length).to.equal(1);
          clock.tick(1000 * 60 * 61); // 1:01 hour
        })
        .then(() => ajax.get('/test-hour'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .finally(() => {
          ajaxGetSpy.restore();
          clock.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('invalidates invalidateUrls endpoints', () => {
      newCacheId();

      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 500,
      });
      const ajaxGetSpy = sinon.spy(ajax, 'get');
      const ajaxPostSpy = sinon.spy(ajax, 'post');

      server.respondWith(/\/test-valid-url/, xhr => {
        xhr.respond(
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ some: 'data-valid-url' }),
        );
      });

      server.respondWith(/\/test-invalid-url/, xhr => {
        xhr.respond(
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ some: 'data-invalid-url' }),
        );
      });
      const actionConfig = {
        cacheOptions: {
          invalidateUrls: ['/test-invalid-url'],
        },
      };

      return ajax
        .get('/test-valid-url', actionConfig)
        .then(() => {
          expect(server.requests.length).to.equal(1);
        })
        .then(() => ajax.get('/test-invalid-url'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .then(() =>
          // 'post' will invalidate 'own' cache and the one mentioned in config
          ajax.post('/test-valid-url', {}, actionConfig),
        )
        .then(() => {
          expect(server.requests.length).to.equal(3);
        })
        .then(() => ajax.get('/test-invalid-url'))
        .then(() => {
          // indicates that 'test-invalid-url' cache was removed
          // because the server registered new request
          expect(server.requests.length).to.equal(4);
        })
        .finally(() => {
          ajaxGetSpy.restore();
          ajaxPostSpy.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('invalidates cache on a post', () => {
      newCacheId();

      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 100,
      });
      const ajaxGetSpy = sinon.spy(ajax, 'get');
      const ajaxPostSpy = sinon.spy(ajax, 'post');

      server.respondWith(/\/test-post/, [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({ some: 'data-post' }),
      ]);

      return ajax
        .get('/test-post')
        .then(() => {
          expect(ajaxGetSpy.calledOnce).to.be.true;
          expect(ajaxGetSpy.calledWith('/test-post')).to.be.true;
          expect(server.requests.length).to.equal(1);
        })
        .then(() => ajax.post('/test-post', { some: 'data-post' }))
        .then(() => {
          expect(ajaxPostSpy.calledOnce).to.be.true;
          expect(ajaxPostSpy.calledWith('/test-post')).to.be.true;
          expect(server.requests.length).to.equal(2);
        })
        .then(() => ajax.get('/test-post'))
        .then(() => {
          expect(server.requests.length).to.equal(3);
        })
        .finally(() => {
          ajaxGetSpy.restore();
          ajaxPostSpy.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('caches response but does not return it when expiration time is 0', () => {
      newCacheId();

      const indexes = addCacheInterceptors(ajax, {
        useCache: true,
        timeToLive: 0,
      });

      const ajaxGetSpy = sinon.spy(ajax, 'get');

      return ajax
        .get('/test')
        .then(() => {
          const clock = sinon.useFakeTimers();
          expect(ajaxGetSpy.calledOnce).to.be.true;
          expect(ajaxGetSpy.calledWith('/test')).to.be.true;
          clock.tick(1);
          clock.restore();
        })
        .then(() => ajax.get('/test'))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .finally(() => {
          ajaxGetSpy.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });

    it('does not use cache when `useCache: false` in the action', () => {
      newCacheId();
      getCacheIdentifier = () => 'cacheIdentifier2';

      const ajaxAlwaysGetSpy = sinon.spy(ajax, 'get');
      const indexes = addCacheInterceptors(ajax, { useCache: true });

      return ajax
        .get('/test')
        .then(() => {
          expect(ajaxAlwaysGetSpy.calledOnce, 'calledOnce').to.be.true;
          expect(ajaxAlwaysGetSpy.calledWith('/test'));
        })
        .then(() => ajax.get('/test', { cacheOptions: { useCache: false } }))
        .then(() => {
          expect(server.requests.length).to.equal(2);
        })
        .finally(() => {
          ajaxAlwaysGetSpy.restore();
          removeCacheInterceptors(ajax, indexes);
        });
    });
  });
});