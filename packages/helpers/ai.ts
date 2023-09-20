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

const getSummarizePrompt = (languageCode: string) => {
  const language = getInfoForLanguage(languageCode);

  return `Summarize the text.
    Give preference to more paragraphs over fewer paragraphs, and make them as short as possible.
    Give the summary a short title.
    Give your reply in the language ${language?.language} (${language?.code}). 
    Follow strictly the given pattern for the reply, using HTML for formatting:

    <b>Section:</b> [title]<br>
    <b>Summary:</b> <span>[summary]</span><br>
`;
};

const getOutlinePrompt = (languageCode: string) => {
  const language = getInfoForLanguage(languageCode);

  return `Create an outline for the text.
    Give the outline a short title and provide bullet points for the key parts of the text.
    Use a hierarchical structure for the outline.
    Give your reply in the language ${language?.language} (${language?.code}). 
    Output multiple sections and provide a title for each section, following strictly the format below with HTML for formatting:

    <b>Section:</b> [title]<br>
    <span>[outline]</span><br>`;
};

const getExplainPrompt = (languageCode: string) => {
  const language = getInfoForLanguage(languageCode);

  return `Explain this text like I am 12 years old.
    Give your reply in the language ${language?.language} (${language?.code}). 
    Follow strictly the given pattern for the reply, using HTML for formatting:

    <b>Section:</b> [title]<br>
    <span>[explanation]</span><br>`;
};

const getPrompt = (type: SummaryType, languageCode: string) => {
  if (type === 'SUMMARY') {
    return getSummarizePrompt(languageCode);
  } else if (type === 'OUTLINE') {
    return getOutlinePrompt(languageCode);
  } else {
    return getExplainPrompt(languageCode);
  }
};

export async function summarizeText(text: string, file: string, languageCode: string, type: SummaryType) {
  const logger = new FileLogger(file);
  const question = getPrompt(type, languageCode);
  const model = getModelThatFits(text, question);

  if (model) {
    console.debug('Found model that fits text', model);
    const prompt = buildPrompt([text], question, model);
    logger.logToFile('single-prompt.txt', prompt);

    const openAIResponse = await callOpenAi(prompt, logger, model);

    console.debug('OpenAI response', openAIResponse);

    return openAIResponse.message;
  } else {
    console.debug('No model found that fits text');
    return summarizeLongText(text, file, languageCode, type);
  }
}

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

    const prompt = buildPrompt(representativesTexts, getPrompt(type, languageCode));

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
