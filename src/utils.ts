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
