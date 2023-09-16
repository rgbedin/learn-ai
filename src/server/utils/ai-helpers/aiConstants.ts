import { type TiktokenModel } from "tiktoken";

// Embeddings
export const BATCH_SIZE_FOR_EMBEDDINGS = 250;
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-ada-002";
export const DEFAULT_EMBEDDING_MODEL_PRICE_PER_1000 = 0.0001;

// Chunks
export const DEFAULT_MAX_TOKENS_PER_CHUNK = 1250;
export const NUM_REPRESENTATIVES_CHUNKS_PER_BUCKET = 3;
export const CHUNKS_PER_BUCKET = 15;

export const DEFAULT_REPLY_MAX_TOKENS = 256;

export type AiModel = {
  model: TiktokenModel;
  maxTokens: number;
  pricePer1000Input: number;
  pricePer1000Output: number;
};

export const AI_MODELS: Record<string, AiModel> = {
  "gpt-3.5-turbo": {
    model: "gpt-3.5-turbo",
    maxTokens: 4097,
    pricePer1000Input: 0.0015,
    pricePer1000Output: 0.002,
  },
  "gpt-3.5-turbo-16k": {
    model: "gpt-3.5-turbo-16k",
    maxTokens: 16385,
    pricePer1000Input: 0.003,
    pricePer1000Output: 0.004,
  },
  // "gpt-4": {
  //   model: "gpt-4",
  //   maxTokens: 8192,
  //   pricePer1000Input: 0.03,
  //   pricePer1000Output: 0.06,
  // },
  // "gpt-4-32k": {
  //   model: "gpt-4-32k",
  //   maxTokens: 32768,
  //   pricePer1000Input: 0.06,
  //   pricePer1000Output: 0.12,
  // },
};

export const DEFAULT_AI_MODEL = AI_MODELS["gpt-3.5-turbo"]!;
