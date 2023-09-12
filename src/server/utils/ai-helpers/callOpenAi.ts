import { type ChatCompletionMessage } from "openai/resources/chat";
import { OpenAI } from "openai";
import {
  type AiModel,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_MODEL_MAX_TOKENS,
  DEFAULT_AI_MODEL_PRICE_PER_1000_INPUT,
  DEFAULT_AI_MODEL_PRICE_PER_1000_OUTPUT,
} from "./aiConstants";
import { encoding_for_model } from "tiktoken";
import { type FileLogger } from "../logHelper";

const client = new OpenAI({
  maxRetries: 3,
});

export async function callOpenAi(
  prompt: string,
  logger?: FileLogger,
  customModel?: AiModel,
  instructions = "You are a helpful assistant answering questions based on the context provided.",
  temperature = 0.6,
) {
  const messages: ChatCompletionMessage[] = [
    {
      role: "system",
      content: instructions,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const tk = encoding_for_model(customModel?.model ?? DEFAULT_AI_MODEL);
  const tokens = tk.encode(prompt).length + tk.encode(instructions).length;

  const maxTokens =
    (customModel?.maxTokens ?? DEFAULT_AI_MODEL_MAX_TOKENS) - tokens - 10;

  console.debug("Calling OpenAI w/", tokens, "tokens estimated", {
    maxTokens,
    customModel,
  });

  const fileName = `openai-${Date.now()}.txt`;

  logger?.logToFile(
    fileName,
    `REQUEST:\nMAX_TOKENS=${maxTokens}\nPROMPT=${prompt}\n\n***\n\n`,
  );

  const completion = await client.chat.completions.create({
    messages: messages,
    model: customModel?.model ?? DEFAULT_AI_MODEL,
    temperature: temperature,
    max_tokens: maxTokens,
    stop: ["Human:", "AI:"], // The completion can’t change the speaker.
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  completion.usage?.total_tokens &&
    console.debug("OpenAI tokens used:", {
      output: completion.usage?.completion_tokens,
      input: completion.usage?.prompt_tokens,
    });

  const inputTokens = completion.usage?.prompt_tokens;
  const outputTokens = completion.usage?.completion_tokens;

  if (
    !completion.choices[0]?.message.content ||
    !inputTokens ||
    !outputTokens
  ) {
    throw new Error("Failed to fetch response from OpenAI");
  }

  const estimatedPricing =
    (inputTokens / 1000) *
      (customModel?.pricePer1000Input ??
        DEFAULT_AI_MODEL_PRICE_PER_1000_INPUT) +
    (outputTokens / 1000) *
      (customModel?.pricePer1000Output ??
        DEFAULT_AI_MODEL_PRICE_PER_1000_OUTPUT);

  logger?.logToFile(
    fileName,
    `RESPONSE:\n***\n\n${JSON.stringify(completion, null, 2)}\n\n`,
  );

  return {
    message: completion.choices[0].message.content,
    tokensUsed: completion.usage!.total_tokens,
    estimatedPricing,
  };
}
