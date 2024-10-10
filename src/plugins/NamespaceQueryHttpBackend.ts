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
    // Check if the namespace includes query parameters using the "$" separator
    if (ns.includes('$')) {
      // Custom handling when query parameters are included
      const [baseNamespace, queryParams] = this.splitNamespace(ns);

      try {
        const loadPath = await this.resolveLoadPath(lng, baseNamespace);
        if (!loadPath) {
          callback(
            new Error(`No loadPath defined for namespace: ${baseNamespace}`),
            false
          );
          return;
        }

        // Construct the URL with query parameters
        const url = this.constructUrl(loadPath, queryParams);
        super.loadUrl(url, callback); // Reuse original `loadUrl` to fetch the data
      } catch (error) {
        callback(error as Error, false);
      }
    } else {
      // Delegate to the original `read` method if no query parameters are present
      super.read(lng, ns, callback);
    }
  }

  /**
   * Splits the namespace string into baseNamespace and queryParams based on the "$" separator.
   * @param ns The namespace string, which may contain a query string after "$".
   * @returns A tuple containing the base namespace and the query parameters, if any.
   */
  private splitNamespace(ns: string): [string, URLSearchParams?] {
    const indexOfSeparator = ns.indexOf('$');
    if (indexOfSeparator === -1) {
      // Return early if there is no query string
      return [ns];
    }

    // Separate baseNamespace and queryParams
    const baseNamespace = ns.substring(0, indexOfSeparator);
    const queryParams = new URLSearchParams(ns.substring(indexOfSeparator + 1));

    return [baseNamespace, queryParams];
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
      // Direct replacement using template literals
      return Promise.resolve(
        loadPath.replace('{{ns}}', baseNamespace).replace('{{lng}}', lng)
      );
    }

    if (typeof loadPath === 'function') {
      return Promise.resolve(loadPath([lng], [baseNamespace]));
    }
    return Promise.reject(new Error('No valid loadPath found.'));
  }

  /**
   * Constructs the final URL using the URL API, which handles query parameters automatically.
   * @param loadPath The resolved load path.
   * @param queryParams The optional query string parameters to append to the load path.
   * @returns The fully constructed URL with query parameters.
   */
  private constructUrl(
    loadPath: string,
    queryParams?: URLSearchParams
  ): string {
    // Reuse the URL object to avoid multiple allocations
    const url = new URL(loadPath);

    if (queryParams && queryParams.toString()) {
      // Append only if there are query parameters
      for (const [key, value] of queryParams.entries()) {
        url.searchParams.append(key, value);
      }
    }

    return url.toString();
  }
}
