import { Model } from 'mongoose';

/**
 * Drops every non-_id index on the given collections and rebuilds them from
 * the current Mongoose schemas.
 *
 * Deployed databases accumulate stale indexes from older schema versions
 * (e.g. an orphaned unique `id_1` index, or duplicate sibling indexes) that
 * make inserts fail with E11000 duplicate-key errors. Resetting the indexes
 * before seeding guarantees a clean, canonical index set for the seed run.
 */
export async function resetIndexes(models: Model<Record<string, unknown>>[]): Promise<void> {
  for (const model of models) {
    const name = model.collection.collectionName;
    try {
      await model.collection.dropIndexes(); // drops all indexes except _id
      await model.init(); // rebuild indexes declared by the current schema
      console.log(`🔁 Indexes reset for ${name}`);
    } catch (error) {
      console.warn(`⚠️ Skipping index reset for ${name}:`, error);
    }
  }
}
