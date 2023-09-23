import { encodingForModel } from 'js-tiktoken';
import { DEFAULT_AI_MODEL, DEFAULT_REPLY_MAX_TOKENS } from './aiConstants';
import { SentenceTokenizer } from 'natural';

export function breakTextIntoConsumableBuckets(question: string, text: string, model = DEFAULT_AI_MODEL): string[] {
  const encoding = encodingForModel(model.model);

  const questionTokens = encoding.encode(question).length;

  const maxTextTokens = model.maxTokens - questionTokens - DEFAULT_REPLY_MAX_TOKENS - 50; // 50 is a buffer for functions

  if (maxTextTokens <= 0) {
    throw new Error('Question length exceeds model token limit.');
  }

  const chunks: string[] = [];

  const tokenizer = new SentenceTokenizer();
  const sentences = tokenizer.tokenize(text);

  let currentSentenceIndex = 0; // Index to keep track of current sentence being processed

  while (currentSentenceIndex < sentences.length) {
    let tokenCount = 0;
    let chunkText = '';

    // Loop through sentences and add them to the current chunk until reaching the maximum token limit
    for (; currentSentenceIndex < sentences.length && tokenCount < maxTextTokens; currentSentenceIndex++) {
      const sentence = sentences[currentSentenceIndex];
      const sentenceTokenCount = encoding.encode(sentence!).length;

      // If a single sentence exceeds the max token limit, skip it.
      if (sentenceTokenCount > maxTextTokens) continue;

      // If adding the current sentence doesn't exceed the token limit, add it to the chunk.
      if (tokenCount + sentenceTokenCount <= maxTextTokens) {
        tokenCount += sentenceTokenCount;
        chunkText += ' ' + sentence;
      } else {
        break;
      }
    }

    if (chunkText.trim()) {
      chunks.push(chunkText.trim());
    }
  }

  // Log the number of tokens per chunk
  let i = 0;
  for (const c of chunks) {
    const tokens = encoding.encode(c).length;
    console.debug('Chunk', ++i, '/', chunks.length, 'has', tokens, 'tokens');
  }

  const averageTokens = chunks.reduce((acc, c) => acc + encoding.encode(c).length, 0) / chunks.length;
  console.debug('Average tokens per chunk', averageTokens, 'tokens');

  return chunks;
}
