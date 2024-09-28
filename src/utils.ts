interface NamespaceWithQuery {
  id?: string;
  namespace: string;
  query?: Record<string, string>;
}

/**
 * Processes a single namespace object into a string with query parameters.
 * @param {NamespaceWithQuery} namespaceObject - The namespace object containing the base namespace and query parameters.
 * @returns {string} - A string representation of the namespace with query parameters.
 */
const processNamespace = ({
  namespace,
  query = {},
}: NamespaceWithQuery): string => {
  const queryString = new URLSearchParams(query).toString();
  return queryString ? `${namespace}$${queryString}` : namespace;
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
  const keys1 = Object.keys(query1);
  const keys2 = Object.keys(query2);

  if (keys1.length !== keys2.length) return false; // Short-circuit if lengths differ

  return keys1.every((key) => query1[key] === query2[key]);
};

/**
 * Processes a namespace or an array of namespaces, converting them into a string format with query parameters,
 * and optionally providing lookup functions by id or by namespace and query.
 *
 * @param {NamespaceWithQuery | NamespaceWithQuery[]} ns - A single namespace object or an array of namespaces.
 * @returns {Object} - An object containing:
 *   - `ns`: A string or an array of strings representing the processed namespaces with query parameters.
 *   - `getNsById`: A function that returns a namespace string by id or undefined if no id exists.
 *   - `getNs`: A function that returns a fully processed namespace string by matching namespace and query.
 */
export const processNamespaces = (
  ns: NamespaceWithQuery | NamespaceWithQuery[]
): {
  ns: string | string[];
  getNsById: (id: string) => string | undefined;
  getNs: (search: {
    namespace: string;
    query: Record<string, string>;
  }) => string | undefined;
} => {
  // Handle the case where `ns` is a single object
  if (!Array.isArray(ns)) {
    return {
      ns: processNamespace(ns),
      getNsById: () => undefined,
      getNs: () => undefined,
    };
  }

  // Use Map for efficient lookups
  const namespaceMap = new Map<string, string>();

  ns.forEach((item, index) => {
    const key = item.id || `${index}`; // Fallback to index if id is not provided
    namespaceMap.set(key, processNamespace(item));
  });

  return {
    ns: Array.from(namespaceMap.values()), // Return array of namespace strings
    getNsById: (id: string) => namespaceMap.get(id), // Retrieve namespace by id
    getNs: ({ namespace, query }) => {
      const foundNamespace = ns.find(
        (item) =>
          item.namespace === namespace && isQueryMatch(item.query, query)
      );

      return foundNamespace ? processNamespace(foundNamespace) : undefined; // Retrieve and process namespace by namespace and query
    },
  };
};
