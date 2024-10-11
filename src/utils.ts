interface NamespaceWithQuery {
  id?: string;
  namespace: string | string[];
  query?: Record<string, string>;
}

/**
 * Processes a namespace or an array of namespaces into a string or an array of strings with query parameters.
 * If `namespace` is an array, query parameters are applied to all namespaces.
 * @param {NamespaceWithQuery} namespaceObject - The namespace object containing the base namespace(s) and query parameters.
 * @returns {string[]} - An array of strings representing the processed namespace(s) with query parameters.
 */
const processNamespace = ({
  namespace,
  query = {},
}: NamespaceWithQuery): string[] => {
  const queryString = new URLSearchParams(query).toString();
  if (Array.isArray(namespace)) {
    return namespace.map(
      (ns) => `${ns}${queryString ? `$${queryString}` : ''}`
    );
  }
  return [`${namespace}${queryString ? `$${queryString}` : ''}`];
};

/**
 * Compares two query objects to check if they are identical.
 * @param {Record<string, string>} query1 - The first query object.
 * @param {Record<string, string>} query2 - The second query object.
 * @returns {boolean} - Returns true if the queries match, false otherwise.
 */
const isQueryMatch = (
  query1: Record<string, string> = {},
  query2: Record<string, string> = {}
): boolean => {
  if (query1 === query2) return true; // Shortcut for identical objects
  const keys1 = Object.keys(query1);
  const keys2 = Object.keys(query2);
  if (keys1.length !== keys2.length) return false; // Early exit if key lengths differ

  for (const key of keys1) {
    if (query1[key] !== query2[key]) return false; // Early exit if any value differs
  }

  return true;
};

/**
 * Creates a string or an array of strings from namespace(s) with optional query parameters.
 * Optionally provides lookup functions by id or by namespace and query.
 *
 * @param {NamespaceWithQuery | NamespaceWithQuery[]} ns - A single namespace object or an array of namespaces.
 * @returns {Object} - An object containing:
 *   - `ns`: A string array representing the processed namespaces with query parameters.
 *   - `getNsById`: A function that returns a namespace string by id or undefined if no id exists.
 *   - `getNs`: A function that returns a fully processed namespace string by matching namespace and query.
 */
export const createNsWithQuery = (
  ns: NamespaceWithQuery | NamespaceWithQuery[]
): {
  ns: string[];
  getNsById: (id: string) => string | undefined;
  getNs: (search: {
    namespace: string;
    query: Record<string, string>;
  }) => string | undefined;
} => {
  // Normalize `ns` into an array
  const namespaceArray = Array.isArray(ns) ? ns : [ns];

  // Map each namespace by id or index, and flatten the processed strings directly
  const namespaceMap = new Map<string, string[]>();

  for (const [index, item] of namespaceArray.entries()) {
    const key = item.id || `${index}`;
    namespaceMap.set(key, processNamespace(item));
  }

  // Flatten the namespace strings once for efficient lookups
  const flattenedNs = Array.from(namespaceMap.values()).flat();

  // Optimize `getNsById` lookup by caching flat strings
  const nsByIdCache = new Map(
    [...namespaceMap.entries()].map(([key, value]) => [key, value.join('|')])
  );

  return {
    ns: flattenedNs,
    getNsById: (id: string) => nsByIdCache.get(id),
    getNs: ({ namespace, query }) => {
      // Find the matching namespace
      const foundNamespace = namespaceArray.find(
        (item) =>
          item.namespace === namespace && isQueryMatch(item.query, query)
      );

      // Process and return the namespace as a string
      if (foundNamespace) {
        const processedNs = processNamespace(foundNamespace);
        return processedNs.join('|');
      }

      return undefined;
    },
  };
};

/**
 * Configuration for the loadPath function.
 * @property {string} loadPath - The base URL path for loading resources.
 * @property {Record<string, string>} [queryStringParams] - Optional default query parameters.
 */
export interface LoadPathConfig {
  loadPath: string;
  queryStringParams?: Record<string, string>;
}

/**
 * Parses a namespace string to extract the base namespace and query parameters.
 *
 * @param {string} namespace - The namespace string in the format "baseNamespace$queryString".
 * @returns {{ baseNamespace: string, queryParams: URLSearchParams }} An object containing the base namespace and query parameters.
 */
const parseNamespace = (namespace: string) => {
  const [baseNamespace, queryString] = namespace.split('$');
  const queryParams = new URLSearchParams(queryString || ''); // Ensure queryString is not undefined
  return { baseNamespace, queryParams };
};

/**
 * Combines default query parameters with the existing ones.
 *
 * @param {URLSearchParams} queryParams - The URLSearchParams object to which default parameters are added.
 * @param {Record<string, string>} [defaultParams={}] - A record of default query parameters to add.
 */
const mergeQueryParams = (
  queryParams: URLSearchParams,
  defaultParams: Record<string, string> = {}
) => {
  Object.entries(defaultParams).forEach(([key, value]) => {
    if (!queryParams.has(key)) queryParams.set(key, value); // Avoid overwriting existing params
  });
};

/**
 * Replaces placeholders in a template string with provided replacement values.
 *
 * @param {string} template - The template string containing placeholders in the format {{key}}.
 * @param {Record<string, string>} replacements - An object mapping placeholder keys to their replacement values.
 * @returns {string} The template string with all placeholders replaced by the corresponding values.
 */
const replacePlaceholders = (
  template: string,
  replacements: Record<string, string>
) => {
  return Object.keys(replacements).reduce(
    (result, key) => result.replace(`{{${key}}}`, replacements[key]),
    template
  );
};

/**
 * Creates a loadPath function based on the provided configuration.
 *
 * @param {LoadPathConfig} config - The configuration object containing the base load path and optional query string parameters.
 * @returns {(lngs: string[], namespaces: string[]) => string[]} A function that generates full load paths for given languages and namespaces.
 */
export const loadPathWithQueryParams = (
  config: LoadPathConfig
): ((lngs: string[], namespaces: string[]) => string[]) => {
  const { loadPath, queryStringParams = {} } = config;

  return (lngs: string[], namespaces: string[]) => {
    return lngs.flatMap((lng) =>
      namespaces.map((namespace) => {
        const { baseNamespace, queryParams } = parseNamespace(namespace);
        mergeQueryParams(queryParams, queryStringParams);

        const finalLoadPath = replacePlaceholders(loadPath, {
          ns: baseNamespace,
          lng,
        });

        const separator = finalLoadPath.includes('?') ? '&' : '?';
        const queryString = queryParams.toString();

        return queryString
          ? `${finalLoadPath}${separator}${queryString}`
          : finalLoadPath;
      })
    );
  };
};
