import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { type SummaryType, type ChatHistoryEntry } from '@prisma/client';
import { OpenAI, PromptTemplate } from 'langchain';
import { FaissStore } from 'langchain/vectorstores/faiss';
import { loadSummarizationChain } from 'langchain/chains';
import { getEmbeddings } from './ai-helpers/getEmbeddings';
import { buildPrompt } from './ai-helpers/buildPrompt';
import { type Chunk, createChunks } from './ai-helpers/createChunks';
import { runKmeans } from './ai-helpers/runKmeans';
import { callOpenAi } from './ai-helpers/callOpenAi';
import {
  BATCH_SIZE_FOR_EMBEDDINGS,
  CHUNKS_PER_BUCKET,
  DEFAULT_AI_MODEL,
  DEFAULT_EMBEDDING_MODEL_PRICE_PER_1000,
  NUM_REPRESENTATIVES_CHUNKS_PER_BUCKET,
} from './ai-helpers/aiConstants';
import { FileLogger } from './logHelper';
import { getModelThatFits } from './ai-helpers/getModelThatFits';
import { getInfoForLanguage } from './getInfoForLanguage';
import { breakTextIntoConsumableBuckets } from './ai-helpers/breakTextIntoConsumableBuckets';

const getSummarizePrompt = (languageCode: string, text?: string) => {
  const language = getInfoForLanguage(languageCode);

  const prompt = `Summarize the text.
    Give the summary a short title; the title should be a short phrase that summarizes the key points.
    Do not start your reply with "The text says" or "The text is about" or anything similar. Start right away with the summary.
    Give your reply strictly in the language ${language?.language} (${language?.code}). Do not use any other language.

    Text to summarize:
    ${text}
`;

  const fn = {
    name: 'do_summary',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the text output',
        },
        summary: {
          type: 'string',
          description: 'The summary of the text output',
        },
      },
    },
  };

  return { prompt, fn };
};

const getOutlinePrompt = (languageCode: string, text?: string) => {
  const language = getInfoForLanguage(languageCode);

  const prompt = `Create an outline for the text.
    Give the outline a short title; the title should be a short phrase that summarizes the key points.
    Do not add an "introduction" or "conclusion" section.
    Give your reply strictly in the language ${language?.language} (${language?.code}). Do not use any other language

    Text to outline:
    ${text}
    `;

  const fn = {
    name: 'do_outline',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the text output',
        },
        outline: {
          type: 'array',
          description:
            'Individual bullet points of the outline of the text output. Each newline is a new bullet point.',
          items: {
            type: 'string',
          },
        },
      },
    },
  };

  return { prompt, fn };
};

const getExplainPrompt = (languageCode: string, text?: string) => {
  const language = getInfoForLanguage(languageCode);

  const prompt = `Explain this text like I am 12 years old.
    Give the explanation a short title; the title should be a short phrase that summarizes the key points of the explanation.
    Do not start your reply with "The text says" or "The text is about" or anything similar. Start right away with the explanation.
    Give your reply strictly in the language ${language?.language} (${language?.code}). Do not use any other language.


    Text to explain:
    ${text}
    `;

  const fn = {
    name: 'do_explain',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the text output',
        },
        explanation: {
          type: 'string',
          description: 'The explanation of the text output',
        },
      },
    },
  };

  return { prompt, fn };
};

const getPrompt = (type: SummaryType, languageCode: string, text?: string) => {
  if (type === 'SUMMARY') {
    return getSummarizePrompt(languageCode, text);
  } else if (type === 'OUTLINE') {
    return getOutlinePrompt(languageCode, text);
  } else {
    return getExplainPrompt(languageCode, text);
  }
};

export async function getBucketsToSummarize(text: string, languageCode: string, type: SummaryType) {
  const { prompt: question } = getPrompt(type, languageCode, '');

  const buckets = breakTextIntoConsumableBuckets(question, text);

  return buckets;
}

export async function summarize(text: string, index: number, file: string, languageCode: string, type: SummaryType) {
  const logger = new FileLogger(file);

  const { prompt: question, fn } = getPrompt(type, languageCode, text);

  const openAIResponse = await callOpenAi(question, logger, fn);

  logger.logToFile(`response-chunk-${index}`, openAIResponse.message);

  return openAIResponse;
}

////// OLD FUNCTIONS BELOW ///////

async function summarizeLongText(text: string, file: string, languageCode: string, type: SummaryType) {
  const logger = new FileLogger(file);
  let tokensUsed = 0;
  let estimatedCost = 0;

  const chunks = createChunks(text, file, logger);

  const { embeddings: vectors, tokensUsed: tokensUsedEmbeddings } = await getEmbeddings(
    chunks,
    BATCH_SIZE_FOR_EMBEDDINGS
  );

  tokensUsed += tokensUsedEmbeddings;

  estimatedCost += (tokensUsedEmbeddings / 1000) * DEFAULT_EMBEDDING_MODEL_PRICE_PER_1000;

  const summariesOfBuckets = await getSummariesOfBuckets(chunks, vectors);

  const finalSummary = compileFinalSummary(summariesOfBuckets);

  logger.logToFile(
    'summary.txt',
    `${finalSummary}\n\nEstimated cost: ${estimatedCost}\n\nTokens used: ${tokensUsed}\n\n`
  );

  console.debug('Final summary', { tokensUsed, estimatedCost });

  return finalSummary;

  // ----------------
  // Helper Functions
  // ----------------

  /**
   * Retrieves summaries for each bucket of chunks.
   * @param chunks The text chunks to be summarized.
   * @param vectors Embeddings corresponding to the chunks.
   * @returns An array of summaries for each bucket.
   */
  async function getSummariesOfBuckets(chunks: Chunk[], vectors: number[][]): Promise<string[]> {
    const numOfBuckets = Math.ceil(chunks.length / CHUNKS_PER_BUCKET);

    const orderedSummaries: string[] = [];

    const bucketPromises = Array.from({ length: numOfBuckets }).map(async (_, i) => {
      const summary = await summarizeBucketUsingKmeans(i, i * CHUNKS_PER_BUCKET, chunks, vectors, {
        includeFirstChunk: true,
        includeLastChunk: true,
      });

      // Insert the summary at the correct index in the ordered array of summaries.
      orderedSummaries[i] = summary;
    });

    await Promise.all(bucketPromises);

    logger.logToFile(`ordered-summaries.txt`, JSON.stringify(orderedSummaries, null, 2));

    return orderedSummaries;
  }

  /**
   * Summarizes a specific bucket of chunks.
   * @param numBucket The bucket number.
   * @param start The start index for the chunks.
   * @param chunks The text chunks to be summarized.
   * @param vectors Embeddings corresponding to the chunks.
   * @returns A summary for the specific bucket.
   */
  async function summarizeBucketUsingKmeans(
    numBucket: number,
    start: number,
    chunks: Chunk[],
    vectors: number[][],
    options?: {
      includeFirstChunk?: boolean;
      includeLastChunk?: boolean;
    }
  ): Promise<string> {
    console.debug('Summarizing bucket using K-means', numBucket, options);

    const bucketOfChunks = chunks.slice(start, start + CHUNKS_PER_BUCKET);

    const bucketOfVectors = vectors.slice(start, start + CHUNKS_PER_BUCKET);

    let numClusters = NUM_REPRESENTATIVES_CHUNKS_PER_BUCKET;

    const v = [...bucketOfVectors];
    const c = [...bucketOfChunks];

    if (options?.includeFirstChunk) {
      numClusters -= 1;
      v.shift();
      c.shift();
    }

    if (options?.includeLastChunk) {
      numClusters -= 1;
      v.pop();
      c.pop();
    }

    let bucketRepresentatives = bucketOfChunks;

    if (numClusters < v.length) {
      bucketRepresentatives = runKmeans(v, c, numClusters);

      if (options?.includeFirstChunk) {
        bucketRepresentatives.unshift(bucketOfChunks[0]!);
      }

      if (options?.includeLastChunk) {
        bucketRepresentatives.push(bucketOfChunks[bucketOfChunks.length - 1]!);
      }

      // Order the representatives by their position in the original text.
      bucketRepresentatives.sort((a, b) => a.start - b.start);
    }

    const representativesTexts = bucketRepresentatives.map((match) => match.text);

    logger.logToFile(`chunks-representatives-${numBucket}.txt`, JSON.stringify(bucketRepresentatives, null, 2));

    const { prompt: p } = getPrompt(type, languageCode);
    const prompt = buildPrompt(representativesTexts, p);

    const { message, tokensUsed: tokensUsedInCall, estimatedPricing: ep } = await callOpenAi(prompt, logger);

    tokensUsed += tokensUsedInCall;
    estimatedCost += ep;

    logger.logToFile(`summaries-representative-${numBucket}.txt`, message);

    return message;
  }

  /**
   * Compiles the final summary from all bucket summaries.
   * @param summaries The summaries of all buckets.
   * @returns The final summarized text.
   */
  function compileFinalSummary(summaries: string[]): string {
    console.debug('Compiling final summary');

    const mergedSummaries = summaries.join('\n\n');

    return mergedSummaries;
  }
}

export async function promptText(text: string, prompt: string, chatHistory?: ChatHistoryEntry[]) {
  // Create the text splitter and split the text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const texts = await textSplitter.createDocuments([text]);

  // Create the in-memory vector index and retriever
  const vectorIndex = await FaissStore.fromDocuments(texts, new OpenAIEmbeddings());

  const retriever = vectorIndex.asRetriever({
    k: 6,
    searchType: 'similarity',
  });

  // Create the conversational interface
  const convInterface = ConversationalRetrievalQAChain.fromLLM(
    new ChatOpenAI({
      modelName: DEFAULT_AI_MODEL.model,
      temperature: 0,
    }),
    retriever,
    {
      verbose: true,
    }
  );

  const strChatHistory =
    chatHistory
      ?.map((message) => {
        return `Human: ${message.question}\nAssistant: ${message.answer}`;
      })
      .join('\n') ?? '';

  // Create the chat history and query
  console.debug('Prompting OpenAI', prompt, strChatHistory);

  const timeNow = new Date().getTime();
  const result = await convInterface.call({
    question: prompt,
    chat_history: strChatHistory,
  });

  console.debug('OpenAI took', new Date().getTime() - timeNow, 'ms');

  return (result as any).text as string;
}

export async function legacySummarizeText(text: string, languageCode: string, type: 'summary' | 'outline') {
  console.debug('Summarizing text', text.length, type);

  // Create the text splitter and split the text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });

  const texts = await textSplitter.createDocuments([text]);

  const model = new OpenAI({
    modelName: 'gpt-3.5-turbo-16k',
    temperature: 0,
  });

  const languageInfo = getInfoForLanguage(languageCode);
  const language = `${languageInfo?.language} (${languageInfo?.code})`;

  if (!languageInfo) {
    throw new Error(`Language ${languageCode} not found`);
  }

  // Prompt used to summarize each chunk of the text
  const MAP_CUSTOM_PROMPT = `
      Summarize the following text in a clear and concise way in ${language}.
      Text: {text}
      Brief Summary:
  `;

  const mapPromptTemplate = new PromptTemplate({
    template: MAP_CUSTOM_PROMPT,
    inputVariables: ['text'],
  });

  // Prompt used to combine the summaries created with the prompt above
  const COMBINE_CUSTOM_PROMPT_SUMMARY = `
    Generate a summary of the following text in ${language}.
    Make sure the summary includes the following elements:

    * An introduction paragraph that provides an overview of the topic.
    * Bullet points that list the key points of the text.
    * A conclusion paragraph that summarizes the main points of the text.

    Text: {text}
`;

  const COMBINE_CUSTOM_PROMPT_OUTLINE = `
    Generate an outline of the following text in ${language}.
    The outline should consist of sections.
    Each section should consist of a title that represents the main idea of the section.
    Each section should also consist of bullet points that list the key points of the section.

    Text: {text}
`;

  const combinePromptTemplate = new PromptTemplate({
    template: type === 'summary' ? COMBINE_CUSTOM_PROMPT_SUMMARY : COMBINE_CUSTOM_PROMPT_OUTLINE,
    inputVariables: ['text'],
  });

  console.debug('Loading summarization chain');

  const chain = loadSummarizationChain(model, {
    type: 'map_reduce',
    combineMapPrompt: mapPromptTemplate,
    combinePrompt: combinePromptTemplate,
  });

  console.debug('Summarizing w/ OpenAI');

  const timeNow = new Date().getTime();

  const res = await chain.call({
    input_documents: texts,
  });

  console.debug('OpenAI took', new Date().getTime() - timeNow, 'ms');

  return (res as any).text as string;
}
