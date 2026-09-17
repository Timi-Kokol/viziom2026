/**
 * Executes a DatoCMS Content Delivery API query with error handling and environment token injection.
 *
 * This utility function wraps the DatoCMS `executeQuery` method, automatically injecting the API token
 * from the `NEXT_DATOCMS_API_TOKEN` environment variable. It returns `null` on failure instead of throwing.
 *
 * @template T - The expected shape of the response data.
 * @param {string} query - The GraphQL query string to execute.
 * @param {object} [options] - Optional options to pass to the DatoCMS client (e.g., variables, preview).
 * @returns {Promise<T | null>} The response data from DatoCMS, or `null` if the request fails.
 *
 * @example
 * ```ts
 * const query = `
 *   query {
 *     allArticles {
 *       id
 *       title
 *     }
 *   }
 * `;
 * const data = await performRequest<{ allArticles: { id: string; title: string }[] }>(query);
 * if (data) {
 *   // Use data.allArticles
 * }
 * ```
 */
import { executeQuery } from '@datocms/cda-client';

export const performRequest = async <T = any>(
  query: string,
  options?: Record<string, any>
): Promise<T | null> => {
  try {
    // Check if API token is available
    if (!process.env.NEXT_DATOCMS_API_TOKEN) {
      return null;
    }

    const queryResponse = await executeQuery(query, {
      ...options,
      token: process.env.NEXT_DATOCMS_API_TOKEN,
      // environment: process.env.NODE_ENV,
    });

    return queryResponse as T;
  } catch {
    return null;
  }
};
