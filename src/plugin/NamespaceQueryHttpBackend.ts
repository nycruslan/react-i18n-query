import HttpBackend, { type HttpBackendOptions } from 'i18next-http-backend';
import type { ReadCallback, Services } from 'i18next';

/**
 * A custom backend for handling i18next namespaces with query parameters.
 * This class extends the default HttpBackend functionality by allowing namespaces
 * to include query parameters using a "$" separator between the namespace and query string.
 *
 * Example namespace format: "namespace$queryString"
 */
export class NamespaceQueryHttpBackend extends HttpBackend {
  /**
   * Constructs a new NamespaceQueryHttpBackend instance.
   * @param services i18next services
   * @param options HttpBackend options
   */
  constructor(services: Services, options: HttpBackendOptions = {}) {
    super(services, options);
  }

  /**
   * Reads the translation for the specified language and namespace, supporting query parameters.
   * @param lng The language to load translations for.
   * @param ns The namespace, which may include query parameters separated by "$".
   * @param callback The callback to invoke when the translation is loaded.
   */
  async read(lng: string, ns: string, callback: ReadCallback): Promise<void> {
    const [baseNamespace, queryParams] = this.splitNamespace(ns);

    try {
      const loadPath = await this.resolveLoadPath(lng, baseNamespace);
      if (!loadPath) {
        return callback(
          new Error(`No loadPath defined for namespace: ${baseNamespace}`),
          false
        );
      }

      const url = this.constructUrl(loadPath, queryParams);
      super.loadUrl(url, callback);
    } catch (error) {
      callback(error as Error, false);
    }
  }

  /**
   * Splits the namespace string into baseNamespace and queryParams based on the "$" separator.
   * @param ns The namespace string, which may contain a query string after "$".
   * @returns A tuple containing the base namespace and the query parameters, if any.
   */
  private splitNamespace(ns: string): [string, string?] {
    const [baseNamespace, queryParams] = ns.split('$');
    return [baseNamespace, queryParams || ''];
  }

  /**
   * Resolves the load path for a given language and base namespace.
   * Supports both string and function types for loadPath.
   * @param lng The language to load translations for.
   * @param baseNamespace The base namespace (without query parameters).
   * @returns The resolved load path or undefined if no load path is configured.
   */
  private resolveLoadPath(
    lng: string,
    baseNamespace: string
  ): Promise<string | undefined> {
    const { loadPath } = this.options;

    if (typeof loadPath === 'string') {
      return Promise.resolve(
        loadPath.replace('{{ns}}', baseNamespace).replace('{{lng}}', lng)
      );
    }

    if (typeof loadPath === 'function') {
      return Promise.resolve(loadPath([lng], [baseNamespace]));
    }

    console.error(`Unexpected loadPath type: ${typeof loadPath}`);
    return Promise.resolve(undefined);
  }

  /**
   * Constructs the final URL using the URL API, which handles query parameters automatically.
   * @param loadPath The resolved load path.
   * @param queryParams The optional query string parameters to append to the load path.
   * @returns The fully constructed URL with query parameters.
   */
  private constructUrl(loadPath: string, queryParams?: string): string {
    const url = new URL(loadPath);

    if (queryParams) {
      const searchParams = new URLSearchParams(queryParams);
      searchParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }
}
