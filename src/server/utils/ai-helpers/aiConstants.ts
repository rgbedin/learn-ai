import { type TiktokenModel } from "tiktoken";

export const DEFAULT_EMBEDDING_MODEL = "text-embedding-ada-002";

export const DEFAULT_EMBEDDING_MODEL_PRICE_PER_1000 = 0.0001;

export const DEFAULT_AI_MODEL: TiktokenModel = "gpt-3.5-turbo";
export const DEFAULT_AI_MODEL_PRICE_PER_1000_INPUT = 0.0015;
export const DEFAULT_AI_MODEL_PRICE_PER_1000_OUTPUT = 0.002;
export const DEFAULT_AI_MODEL_MAX_TOKENS = 4097;

export const LONG_AI_MODEL: TiktokenModel = "gpt-3.5-turbo-16k";
export const LONG_AI_MODEL_PRICE_PER_1000_INPUT = 0.003;
export const LONG_AI_MODEL_PRICE_PER_1000_OUTPUT = 0.004;
export const LONG_AI_MODEL_MAX_TOKENS = 16385;

export const DEFAULT_MAX_TOKENS_PER_CHUNK = 1250;
export const DEFAULT_REPLY_MAX_TOKENS = 256;
export const DEFAULT_PROMPT_MAX_TOKENS =
  DEFAULT_AI_MODEL_MAX_TOKENS - DEFAULT_REPLY_MAX_TOKENS;
export const DEFAULT_MAX_CHUNKS_PER_PROMPT =
  DEFAULT_PROMPT_MAX_TOKENS / DEFAULT_MAX_TOKENS_PER_CHUNK;

export type AiModel = {
  model: TiktokenModel;
  maxTokens: number;
  pricePer1000Input: number;
  pricePer1000Output: number;
};

export const AI_MODELS: Record<string, AiModel> = {
  "gpt-3.5-turbo": {
    model: DEFAULT_AI_MODEL,
    maxTokens: DEFAULT_AI_MODEL_MAX_TOKENS,
    pricePer1000Input: DEFAULT_AI_MODEL_PRICE_PER_1000_INPUT,
    pricePer1000Output: DEFAULT_AI_MODEL_PRICE_PER_1000_OUTPUT,
  },
  "gpt-3.5-turbo-16k": {
    model: LONG_AI_MODEL,
    maxTokens: LONG_AI_MODEL_MAX_TOKENS,
    pricePer1000Input: LONG_AI_MODEL_PRICE_PER_1000_INPUT,
    pricePer1000Output: LONG_AI_MODEL_PRICE_PER_1000_OUTPUT,
  },
};
