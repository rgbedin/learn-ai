import { encoding_for_model } from "tiktoken";
import { DEFAULT_AI_MODEL, DEFAULT_PROMPT_MAX_TOKENS } from "./aiConstants";

/**
 * Constructs a prompt string for the OpenAI API based on provided contexts and a question.
 *
 * This function is designed to fit as much context as possible within a given token limit, ensuring
 * the question is always included. The final prompt structure will be:
 * "Answer the question based on the context below.\n\nContext:\n[Contexts separated by \n\n---\n\n]\n\nQuestion: [question]\nAnswer:"
 *
 * If the combined token count of contexts and the question exceeds the token limit, the function will
 * trim the contexts accordingly.
 *
 * @param contexts - An array of context strings. These contexts provide background or information
 *                   for the question.
 * @param question - The main question to be included in the prompt.
 * @param tokenLimit - The maximum number of tokens the final prompt should contain.
 * @param model - The AI model to be used, which dictates the tokenization scheme.
 *                Default is whatever's set in DEFAULT_AI_MODEL.
 * @returns A formatted prompt string based on the provided contexts and question. Returns null if the prompt can't be constructed.
 */
export function buildPrompt(
  contexts: string[],
  question: string,
  tokenLimit = DEFAULT_PROMPT_MAX_TOKENS,
  model = DEFAULT_AI_MODEL,
): string {
  console.debug("Building prompt", { tokenLimit, model });

  const promptStart =
    "Answer the question based on the context below.\n\nContext:\n";

  const promptEnd = `\n\nQuestion: ${question}\nAnswer:`;

  const tke = encoding_for_model(model);

  const questionTokens = tke.encode(question);

  let currentTokenCount = questionTokens.length;

  let prompt = "";

  for (let i = 0; i < contexts.length; i++) {
    const contextTokens = tke.encode(contexts[i]!);

    currentTokenCount += contextTokens.length;

    // If adding this context exceeds the token limit, construct the prompt with the contexts that fit and break the loop.
    if (currentTokenCount >= tokenLimit) {
      prompt =
        promptStart + contexts.slice(0, i).join("\n\n---\n\n") + promptEnd;

      break;
    }
    // If this is the last context and it fits within the token limit, add it to the prompt.
    else if (i === contexts.length - 1) {
      prompt = promptStart + contexts.join("\n\n---\n\n") + promptEnd;
    }
  }

  return prompt;
}
