import { encoding_for_model } from "tiktoken";
import { AI_MODELS, DEFAULT_REPLY_MAX_TOKENS } from "./aiConstants";
import { tokensForQuestion } from "./buildPrompt";

export function getModelThatFits(text: string, question: string) {
  const modelsOrderedByPrice = Object.values(AI_MODELS).sort(
    (a, b) => a.pricePer1000Input - b.pricePer1000Input,
  );

  for (const model of modelsOrderedByPrice) {
    const tk = encoding_for_model(model.model);
    const tokens = tk.encode(text).length;

    const maxTokens =
      model.maxTokens -
      DEFAULT_REPLY_MAX_TOKENS -
      tokensForQuestion(question, model.model);

    if (tokens <= maxTokens) return model;
  }

  return false;
}
