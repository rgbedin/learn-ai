import { type ChatCompletionMessage } from 'openai/resources/chat';
import { OpenAI } from 'openai';
import { promptTokensEstimate } from 'openai-chat-tokens';
import { DEFAULT_AI_MODEL } from './aiConstants';
import { encodingForModel } from 'js-tiktoken';
import { FileLogger } from '../logHelper';

const client = new OpenAI({
  maxRetries: 3,
});

export async function callOpenAi(
  prompt: string,
  logger?: FileLogger,
  fn?: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function,
  model = DEFAULT_AI_MODEL,
  instructions = 'You are a helpful assistant that helps people understand long texts. You are careful to always provide enough context so the person can understand your answer without having to read the original text. You strictly follow your instructions.',
  temperature = 0.6
) {
  const messages: ChatCompletionMessage[] = [
    {
      role: 'system',
      content: instructions,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const tokens = promptTokensEstimate({
    messages,
    functions: fn ? [fn] : undefined,
    function_call: fn ? { name: fn.name } : undefined,
  });

  const maxTokens = model.maxTokens - tokens - 10;

  console.debug('Calling OpenAI w/', tokens, 'tokens estimated', {
    maxTokens,
    model,
    messages,
  });

  try {
    const fileName = `openai-${Date.now()}.txt`;

    logger?.logToFile(fileName, `REQUEST:\nMAX_TOKENS=${maxTokens}\nPROMPT=${prompt}\n\n***\n\n`);

    const completion = await client.chat.completions.create({
      messages: messages,
      model: model?.model ?? DEFAULT_AI_MODEL,
      temperature: temperature,
      // max_tokens: maxTokens,
      stop: ['Human:', 'AI:'], // The completion can’t change the speaker.
      top_p: 0.7,
      frequency_penalty: 0,
      presence_penalty: 0,
      functions: fn ? [fn] : undefined,
      function_call: fn
        ? {
            name: fn.name,
          }
        : undefined,
    });

    console.debug('OpenAI response', completion, { message: JSON.stringify(completion.choices[0]?.message, null, 2) });

    completion.usage?.total_tokens &&
      console.debug('OpenAI tokens used:', {
        output: completion.usage?.completion_tokens,
        input: completion.usage?.prompt_tokens,
      });

    const inputTokens = completion.usage?.prompt_tokens;
    const outputTokens = completion.usage?.completion_tokens;

    const res = fn ? completion.choices[0]?.message.function_call?.arguments : completion.choices[0]?.message.content;

    if (!res || !inputTokens || !outputTokens) {
      throw new Error('Failed to fetch response from OpenAI');
    }

    const estimatedPricing =
      (inputTokens / 1000) * (model?.pricePer1000Input ?? model.pricePer1000Input) +
      (outputTokens / 1000) * (model?.pricePer1000Output ?? model.pricePer1000Output);

    logger?.logToFile(fileName, `RESPONSE:\n***\n\n${JSON.stringify(completion, null, 2)}\n\n`);

    const r = {
      message: res,
      tokensUsed: completion.usage!.total_tokens,
      estimatedPricing,
    };

    console.debug('OpenAI return', r);

    return r;
  } catch (err: any) {
    console.error('Error calling OpenAI', err?.message);
    throw err;
  }
}
