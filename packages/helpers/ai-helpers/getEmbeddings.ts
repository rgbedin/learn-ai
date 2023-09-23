import { OpenAI } from "openai";
import { type Chunk } from "./createChunks";
import { DEFAULT_EMBEDDING_MODEL } from "./aiConstants";

const client = new OpenAI({
  maxRetries: 3,
});

async function callEmbeddingApi(texts: string[], embedModel: string) {
  console.debug("Calling OpenAI embeddings API", texts.length);

  const response = await client.embeddings.create({
    input: texts,
    model: embedModel,
  });

  console.debug("OpenAI embeddings tokens used:", response.usage.total_tokens);

  return { data: response.data, tokensUsed: response.usage.total_tokens };
}

/**
 * Fetches embeddings for a batch of text chunks using the specified embedding model.
 *
 * The function splits the chunks into smaller batches based on the given `batchSize` and then
 * sends these batches one by one to the OpenAI API to get their embeddings. The embeddings are
 * then aggregated into a single array and returned.
 *
 * If the API fails to return embeddings for a batch, the function throws an error.
 *
 * @param chunks - An array of text chunks for which embeddings are to be fetched.
 * @param batchSize - The number of chunks to be sent in a single API call.
 * @param embedModel - The identifier for the embedding model to use.
 * @returns An array of embeddings, where each embedding is an array of numbers.
 */
export async function getEmbeddings(
  chunks: Chunk[],
  batchSize = 100,
  embedModel = DEFAULT_EMBEDDING_MODEL,
) {
  const embeddings: number[][] = [];

  let tokens = 0;

  const chunkLength = chunks.length;

  for (let i = 0; i < chunkLength; i += batchSize) {
    const iEnd = Math.min(chunkLength, i + batchSize);

    const texts = chunks.slice(i, iEnd).map((chunkItem) => chunkItem.text);

    const { data, tokensUsed } = await callEmbeddingApi(texts, embedModel);

    tokens += tokensUsed;

    if (!data) {
      throw new Error("Failed to fetch embeddings for chunks");
    }

    const embeds = data.map((record) => record.embedding);
    embeddings.push(...embeds);
  }

  return { embeddings, tokensUsed: tokens };
}

/**
 * Fetches an embedding for a single piece of text using the specified embedding model.
 *
 * This function sends the given text to the OpenAI API and retrieves its embedding.
 * If the API fails to return an embedding, the function throws an error.
 *
 * @param text - The text for which the embedding is to be fetched.
 * @param embedModel - The identifier for the embedding model to use.
 * @returns An embedding for the given text, represented as an array of numbers.
 */
export async function getEmbedding(
  text: string,
  embedModel = DEFAULT_EMBEDDING_MODEL,
) {
  const { data, tokensUsed } = await callEmbeddingApi([text], embedModel);

  if (!data || data.length === 0) {
    throw new Error("Failed to fetch embeddings for single text");
  }

  return { embedding: data[0]!.embedding, tokensUsed: tokensUsed };
}
