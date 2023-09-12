import { encoding_for_model } from "tiktoken";
import {
  AI_MODELS,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_MODEL_MAX_TOKENS,
  DEFAULT_REPLY_MAX_TOKENS,
  LONG_AI_MODEL,
  LONG_AI_MODEL_MAX_TOKENS,
} from "./aiConstants";
import { tokensForQuestion } from "./buildPrompt";

export function getModelThatFits(text: string, question: string) {
  const tk = encoding_for_model(DEFAULT_AI_MODEL);
  const tokens = tk.encode(text).length;
  const maxTokens =
    DEFAULT_AI_MODEL_MAX_TOKENS -
    DEFAULT_REPLY_MAX_TOKENS -
    tokensForQuestion(question, DEFAULT_AI_MODEL);
  if (tokens <= maxTokens) return AI_MODELS[DEFAULT_AI_MODEL];

  const tkLong = encoding_for_model(LONG_AI_MODEL);
  const tokensLong = tkLong.encode(text).length;
  const maxTokensLong =
    LONG_AI_MODEL_MAX_TOKENS -
    DEFAULT_REPLY_MAX_TOKENS -
    tokensForQuestion(question, LONG_AI_MODEL);
  if (tokensLong <= maxTokensLong) return AI_MODELS[LONG_AI_MODEL];

  return false;
}
