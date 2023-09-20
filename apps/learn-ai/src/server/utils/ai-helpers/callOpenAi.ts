/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ChatCompletionMessage } from "openai/resources/chat";
import { OpenAI } from "openai";
import { DEFAULT_AI_MODEL } from "./aiConstants";
import { encoding_for_model } from "tiktoken";
import { type FileLogger } from "../logHelper";

const client = new OpenAI({
  maxRetries: 3,
});

export async function callOpenAi(
  prompt: string,
  logger?: FileLogger,
  model = DEFAULT_AI_MODEL,
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

  const tk = encoding_for_model(model.model);
  const tokens = tk.encode(prompt).length + tk.encode(instructions).length;

  const maxTokens = model.maxTokens - tokens - 10;

  console.debug("Calling OpenAI w/", tokens, "tokens estimated", {
    maxTokens,
    model,
  });

  try {
    const fileName = `openai-${Date.now()}.txt`;

    logger?.logToFile(
      fileName,
      `REQUEST:\nMAX_TOKENS=${maxTokens}\nPROMPT=${prompt}\n\n***\n\n`,
    );

    const completion = await client.chat.completions.create({
      messages: messages,
      model: model?.model ?? DEFAULT_AI_MODEL,
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
        (model?.pricePer1000Input ?? model.pricePer1000Input) +
      (outputTokens / 1000) *
        (model?.pricePer1000Output ?? model.pricePer1000Output);

    logger?.logToFile(
      fileName,
      `RESPONSE:\n***\n\n${JSON.stringify(completion, null, 2)}\n\n`,
    );

    return {
      message: completion.choices[0].message.content,
      tokensUsed: completion.usage!.total_tokens,
      estimatedPricing,
    };
  } catch (err: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error("Error calling OpenAI", err?.message);
    throw err;
  }
}
