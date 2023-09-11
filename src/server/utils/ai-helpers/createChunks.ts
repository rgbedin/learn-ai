import { encoding_for_model } from "tiktoken";
import { SentenceTokenizer } from "natural";
import { DEFAULT_AI_MODEL, DEFAULT_MAX_TOKENS_PER_CHUNK } from "./aiConstants";

export interface Chunk {
  start: number;
  end: number;
  title: string;
  text: string;
}

/**
 * Creates an array of `Chunk` objects from a given text. Each chunk represents a portion of the input text.
 *
 * The function breaks down the input `fileContent` into smaller chunks, ensuring that each chunk
 * does not exceed a specified number of tokens (`DEFAULT_MAX_TOKENS_PER_CHUNK`). The aim is to create meaningful
 * chunks, so the division is based on sentences rather than arbitrary divisions. Additionally, chunks may
 * have some overlap to provide context.
 *
 * The generated chunks are returned as an array. Each chunk has a `start` and `end` property indicating
 * its position in the array of tokenized sentences, a `title` property derived from the provided `title`
 * parameter, and a `text` property containing the actual content of the chunk.
 *
 * If the function cannot create any chunks (e.g., if all sentences are too long), it throws an error.
 *
 * @param fileContent - The input text to be chunked.
 * @param title - The title to be assigned to each chunk.
 * @returns An array of `Chunk` objects.
 */
export function createChunks(
  fileContent: string,
  title: string,
  maxTokensPerChunk = DEFAULT_MAX_TOKENS_PER_CHUNK,
): Chunk[] {
  console.debug("Creating chunks");

  const chunks: Chunk[] = [];

  const tokenizer = new SentenceTokenizer();

  // Tokenize the file content into individual sentences.
  const sentences = tokenizer.tokenize(fileContent);

  // Initialize tiktoken for the specified embedding model.
  // This helps calculate the number of tokens in each sentence.
  const tiktoken = encoding_for_model(DEFAULT_AI_MODEL);

  let chunkStart = 0; // Start of the current chunk in the list of sentences.

  // Keep creating chunks as long as there are sentences left.
  while (chunkStart < sentences.length) {
    let tokenCount = 0; // Counter to keep track of the number of tokens in the current chunk.
    let chunkText = ""; // Text of the current chunk.
    let chunkSentences = 0; // Counter to keep track of the number of sentences in the current chunk.

    // Loop through sentences and add them to the current chunk until reaching the maximum token limit.
    for (
      let i = chunkStart;
      i < sentences.length && tokenCount < maxTokensPerChunk;
      i++
    ) {
      const sentence = sentences[i]!;
      const tiktokens = tiktoken.encode(sentence); // Encode the sentence to get the number of tokens.
      const sentenceTokenCount = tiktokens.length;

      // If a single sentence exceeds the max token limit, skip it.
      if (sentenceTokenCount > maxTokensPerChunk) continue;

      // If adding the current sentence doesn't exceed the token limit, add it to the chunk.
      if (tokenCount + sentenceTokenCount <= maxTokensPerChunk) {
        tokenCount += sentenceTokenCount;
        chunkText += " " + sentence;
        chunkSentences++;
      } else {
        break; // If the token limit is reached, break out of the loop.
      }
    }

    const trimmedText = chunkText.trim(); // Remove any leading or trailing whitespace from the chunk.

    // If there's any content in the chunk, add it to the chunks array.
    if (trimmedText) {
      chunks.push({
        start: chunkStart,
        end: chunkStart + tokenCount,
        title: title,
        text: trimmedText,
      });
    }

    // Determine how much to stride forward for the next chunk, aiming to have some overlap for context.
    // The stride is dynamically calculated as one-fifth of the number of sentences in the current chunk.
    let sentenceStride = Math.floor(chunkSentences / 5);
    if (sentenceStride === 0) {
      sentenceStride = 1; // Ensure the stride is at least 1 to prevent infinite loops.
    }

    chunkStart += sentenceStride; // Update the start position for the next chunk.
  }

  if (chunks.length === 0) {
    throw new Error("no chunks created");
  }

  console.debug("Chunks created", chunks.length);

  return chunks;
}
