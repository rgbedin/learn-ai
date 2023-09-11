import { type TiktokenModel } from "tiktoken";

export const DEFAULT_EMBEDDING_MODEL = "text-embedding-ada-002";

export const DEFAULT_EMBEDDING_MODEL_PRICE_PER_1000 = 0.0001;

export const DEFAULT_AI_MODEL: TiktokenModel = "gpt-3.5-turbo-16k";

export const DEFAULT_AI_MODEL_PRICE_PER_1000_INPUT = 0.003;

export const DEFAULT_AI_MODEL_PRICE_PER_1000_OUTPUT = 0.004;

export const DEFAULT_AI_MODEL_MAX_TOKENS = 16384;

export const DEFAULT_MAX_TOKENS_PER_CHUNK = 1500;

export const DEFAULT_PROMPT_MAX_TOKENS = Math.floor(
  DEFAULT_AI_MODEL_MAX_TOKENS * 0.8,
);

export const DEFAULT_REPLY_MAX_TOKENS = Math.floor(
  DEFAULT_AI_MODEL_MAX_TOKENS * 0.2,
);

export const DEFAULT_MAX_CHUNKS_PER_PROMPT =
  DEFAULT_PROMPT_MAX_TOKENS / DEFAULT_MAX_TOKENS_PER_CHUNK;
