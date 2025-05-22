// one-off: createVectorIndex.ts
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI env var");
  }

  const client = new MongoClient(uri);
  await client.connect();

  const cmd = {
    createIndexes: "apicus-templates",
    indexes: [
      {
        name: "embedding_index",
        key: { embedding: "cosmosSearch" },
        cosmosSearchOptions: {
          kind: "vector-ivf",
          numLists: 1,
          similarity: "COS",
          dimensions: 1536,
        },
      },
    ],
  } as any;

  await client.db("apicus-db-data").command(cmd);

  console.log("Vector index 'embedding_index' created on apicus-templates.");
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});