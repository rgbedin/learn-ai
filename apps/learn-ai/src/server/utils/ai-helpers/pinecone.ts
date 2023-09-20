import { type Chunk } from "./createChunks";
import { Pinecone, type PineconeRecord } from "@pinecone-database/pinecone";

const pinecone = new Pinecone();

type Metadata = {
  file_name: string;
  start: string;
  end: string;
  title: string;
  text: string;
};

const index = pinecone.index<Metadata>("learn-ai");

export async function upsertEmbeddings(
  embeddings: number[][],
  chunks: Chunk[],
  fileyKey: string,
) {
  const vectors: PineconeRecord<Metadata>[] = embeddings.map((embedding, i) => {
    const chunk = chunks[i]!;

    return {
      id: `id-${i}-${fileyKey}`,
      values: embedding,
      metadata: {
        file_name: chunk.title,
        start: chunk.start.toString(),
        end: chunk.end.toString(),
        title: chunk.title,
        text: chunk.text,
      },
    };
  });

  console.debug("Upserting embeddings in Pinecone", vectors.length);

  const chunkSize = 100;

  for (let i = 0; i < vectors.length; i += chunkSize) {
    const chunk = vectors.slice(i, i + chunkSize);
    await index.upsert(chunk);
  }

  console.debug("Upserted embeddings in Pinecone");
}

export async function retrieve(
  questionEmbedding: number[],
  topK: number,
  fileKey: string,
) {
  console.debug("Retrieving embeddings from Pinecone");

  const q = {
    vector: questionEmbedding,
    topK,
    includeMetadata: true,
    filter: { file_name: { $eq: fileKey } },
  };

  const results = await index.query(q);

  console.debug("Retrieved embeddings from Pinecone");

  return results.matches;
}

export default Pinecone;
