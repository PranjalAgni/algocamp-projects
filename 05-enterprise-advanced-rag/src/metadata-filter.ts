/**
 * Metadata filtering: pre-filter or post-filter documents by metadata
 */

import type { Document, MetadataFilter } from './types.js';

/**
 * Filter documents by metadata criteria
 * All specified filters must match (AND logic)
 */
export function filterByMetadata(
  documents: Document[],
  filter: MetadataFilter
): Document[] {
  return documents.filter(doc => {
    // Department filter
    if (filter.department && doc.metadata.department !== filter.department) {
      return false;
    }

    // Type filter
    if (filter.type && doc.metadata.type !== filter.type) {
      return false;
    }

    // Date range filters
    const docDate = new Date(doc.metadata.date);

    if (filter.dateAfter) {
      const afterDate = new Date(filter.dateAfter);
      if (docDate < afterDate) {
        return false;
      }
    }

    if (filter.dateBefore) {
      const beforeDate = new Date(filter.dateBefore);
      if (docDate > beforeDate) {
        return false;
      }
    }

    return true;
  });
}
