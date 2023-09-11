import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { type ChatHistoryEntry } from "@prisma/client";
import { OpenAI, PromptTemplate } from "langchain";
import { FaissStore } from "langchain/vectorstores/faiss";
import { loadSummarizationChain } from "langchain/chains";
import { getInfoForLanguage } from "~/utils/getInfoForLanguage";
import { getEmbeddings } from "./ai-helpers/getEmbeddings";
import { buildPrompt } from "./ai-helpers/buildPrompt";
import { type Chunk, createChunks } from "./ai-helpers/createChunks";
import { runKmeans } from "./ai-helpers/runKmeans";
import { callOpenAi } from "./ai-helpers/callOpenAi";
import {
  DEFAULT_AI_MODEL_MAX_TOKENS,
  DEFAULT_EMBEDDING_MODEL_PRICE_PER_1000,
  DEFAULT_REPLY_MAX_TOKENS,
} from "./ai-helpers/aiConstants";
import { FileLogger } from "./logHelper";

const K_MEANS_NUMBER_CLUSTERS = 10;
const BUCKET_SIZE_FOR_SUMMARY = 100;
const BATCH_SIZE_FOR_EMBEDDINGS = 250;
const PROMPT_SUMMARIZE_CHUNK = `Summarize the following text.`;
const PROMPT_COMBINE_SUMMARY = `
    Generate a summary of the following text.
    Make sure the summary includes the following elements:

    * An introduction paragraph that provides an overview of the topic.
    * Bullet points that list the key points of the text.
    * A conclusion paragraph that summarizes the main points of the text.
`;

export async function summarizeV2(text: string, file: string) {
  const logger = new FileLogger(file);
  let tokensUsed = 0;
  let estimatedCost = 0;

  const chunks = createChunks(text, file);

  const { embeddings: vectors, tokensUsed: tokensUsedEmbeddings } =
    await getEmbeddings(chunks, BATCH_SIZE_FOR_EMBEDDINGS);

  tokensUsed += tokensUsedEmbeddings;
  estimatedCost +=
    (tokensUsedEmbeddings / 1000) * DEFAULT_EMBEDDING_MODEL_PRICE_PER_1000;

  const summariesOfBuckets = await getSummariesOfBuckets(chunks, vectors);

  const finalSummary = await compileFinalSummary(summariesOfBuckets);

  logger.logToFile(
    "summary.txt",
    `${finalSummary}\n\nEstimated cost: ${estimatedCost}\n\nTokens used: ${tokensUsed}\n\n`,
  );

  console.debug("Final summary", { tokensUsed, estimatedCost });

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
  async function getSummariesOfBuckets(
    chunks: Chunk[],
    vectors: number[][],
  ): Promise<string[]> {
    const numOfBuckets = Math.ceil(chunks.length / BUCKET_SIZE_FOR_SUMMARY);

    const orderedSummaries: string[] = [];

    const bucketPromises = Array.from({ length: numOfBuckets }).map(
      async (_, i) => {
        const summary = await summarizeBucketUsingKmeans(
          i,
          i * BUCKET_SIZE_FOR_SUMMARY,
          chunks,
          vectors,
          {
            includeFirstChunk: i === 0,
          },
        );

        // Insert the summary at the correct index in the ordered array of summaries.
        orderedSummaries[i] = summary;
      },
    );

    await Promise.all(bucketPromises);

    logger.logToFile(
      `ordered-summaries.txt`,
      JSON.stringify(orderedSummaries, null, 2),
    );

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
    },
  ): Promise<string> {
    console.debug("Summarizing bucket using K-means", numBucket, options);

    const bucketOfChunks = chunks.slice(start, start + BUCKET_SIZE_FOR_SUMMARY);

    const bucketOfVectors = vectors.slice(
      start,
      start + BUCKET_SIZE_FOR_SUMMARY,
    );

    const numClusters = options?.includeFirstChunk
      ? K_MEANS_NUMBER_CLUSTERS - 1
      : K_MEANS_NUMBER_CLUSTERS;

    const v = [...bucketOfVectors];
    const c = [...bucketOfChunks];

    if (options?.includeFirstChunk) {
      v.shift();
      c.shift();
    }

    const bucketRepresentatives = runKmeans(v, c, numClusters);

    if (options?.includeFirstChunk) {
      bucketRepresentatives.unshift(bucketOfChunks[0]!);
    }

    // Order the representatives by their position in the original text.
    bucketRepresentatives.sort((a, b) => a.start - b.start);

    const representativesTexts = bucketRepresentatives.map(
      (match) => match.text,
    );

    logger.logToFile(
      `chunks-representatives-${numBucket}.txt`,
      JSON.stringify(bucketRepresentatives, null, 2),
    );

    const prompt = buildPrompt(representativesTexts, PROMPT_SUMMARIZE_CHUNK);

    const {
      message,
      tokensUsed: tokensUsedInCall,
      estimatedPricing: ep,
    } = await callOpenAi(prompt, logger);

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
  async function compileFinalSummary(summaries: string[]): Promise<string> {
    const maxRepliesFitInOneCall = Math.floor(
      DEFAULT_AI_MODEL_MAX_TOKENS / DEFAULT_REPLY_MAX_TOKENS - 1,
    );

    while (summaries.length > maxRepliesFitInOneCall) {
      summaries = await summarizeAndCombine(summaries);
    }

    const finalPrompt = buildPrompt(summaries, PROMPT_COMBINE_SUMMARY);

    const {
      message,
      tokensUsed: tokensUsedInCall,
      estimatedPricing: ep,
    } = await callOpenAi(finalPrompt, logger);

    tokensUsed += tokensUsedInCall;
    estimatedCost += ep;

    return message;
  }

  /**
   * Summarizes and combines an array of summaries.
   * @param summaries The summaries to be combined.
   * @returns A combined summary.
   */
  async function summarizeAndCombine(summaries: string[]): Promise<string[]> {
    const splitSummaries = splitIntoManageableSummaries(summaries);

    const combinedSummaries: string[] = [];

    await Promise.all(
      splitSummaries.map(async (summaryBatch, i) => {
        const {
          message,
          tokensUsed: tokensUsedInCall,
          estimatedPricing: ep,
        } = await callOpenAi(summaryBatch, logger);

        tokensUsed += tokensUsedInCall;
        estimatedCost += ep;

        logger.logToFile(`summaries-summary-${i}.txt`, message);

        combinedSummaries[i] = message;
      }),
    );

    logger.logToFile(
      `combined-summaries.txt`,
      JSON.stringify(combinedSummaries, null, 2),
    );

    return combinedSummaries;
  }

  /**
   * Splits summaries into manageable groups for processing.
   * @param summaries The summaries to be split.
   * @returns Summaries split into manageable groups.
   */
  function splitIntoManageableSummaries(summaries: string[]): string[] {
    const maxRepliesFitInOneCall = Math.floor(
      DEFAULT_AI_MODEL_MAX_TOKENS / DEFAULT_REPLY_MAX_TOKENS - 1,
    );

    if (summaries.length <= maxRepliesFitInOneCall) {
      return [buildPrompt(summaries, PROMPT_SUMMARIZE_CHUNK)];
    } else {
      const half = Math.ceil(summaries.length / 2);

      return [
        ...splitIntoManageableSummaries(summaries.slice(0, half)),
        ...splitIntoManageableSummaries(summaries.slice(half)),
      ];
    }
  }
}

export function promptFile(question: string, fileKey: string) {
  // const questionEmbedding = await getEmbedding(
  //   question,
  //   "text-embedding-ada-002",
  // );

  // console.debug("Retrieving embedding for question", questionEmbedding);

  // const matches = await retrieve(questionEmbedding, 4, fileKey);

  // console.debug("Retrieved matches from vector DB", matches, fileKey);

  // // Extract context text and titles from the matches
  // const contexts: Context[] = matches!.map((match) => {
  //   return {
  //     text: match.metadata?.text ?? "",
  //     title: match.metadata?.title ?? "",
  //   };
  // });

  // console.log(
  //   "[QuestionHandler] Retrieved context from vector DB:\n",
  //   contexts,
  // );

  // // step 3: Structure the prompt with a context section + question, using top x results from vector DB as the context
  // const contextTexts = contexts.map((context) => context.text);

  // let prompt = buildPrompt(contextTexts, question);

  // if (!prompt) {
  //   prompt = question;
  // }

  // const openAIResponse = await callOpenAi(
  //   prompt,
  //   "You are a helpful assistant answering questions based on the context provided.",
  //   512,
  // );

  // console.log("[QuestionHandler] OpenAI response:\n", openAIResponse);

  // const answer = {
  //   answer: openAIResponse,
  //   context: contexts,
  // };
  //
  // return openAIResponse;

  return "";
}

export async function promptLongText(
  text: string,
  prompt: string,
  chatHistory?: ChatHistoryEntry[],
) {
  // Create the text splitter and split the text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const texts = await textSplitter.createDocuments([text]);

  // Create the in-memory vector index and retriever
  const vectorIndex = await FaissStore.fromDocuments(
    texts,
    new OpenAIEmbeddings(),
  );

  const retriever = vectorIndex.asRetriever({
    k: 6,
    searchType: "similarity",
  });

  // Create the conversational interface
  const convInterface = ConversationalRetrievalQAChain.fromLLM(
    new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0,
    }),
    retriever,
    {
      verbose: true,
    },
  );

  const strChatHistory =
    chatHistory
      ?.map((message) => {
        return `Human: ${message.question}\nAssistant: ${message.answer}`;
      })
      .join("\n") ?? "";

  // Create the chat history and query
  console.debug("Prompting OpenAI", prompt, strChatHistory);

  const timeNow = new Date().getTime();
  const result = await convInterface.call({
    question: prompt,
    chat_history: strChatHistory,
  });

  console.debug("OpenAI took", new Date().getTime() - timeNow, "ms");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  return (result as any).text as string;
}

export async function summarizeText(
  text: string,
  languageCode: string,
  type: "summary" | "outline",
) {
  console.debug("Summarizing text", text.length, type);

  // Create the text splitter and split the text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 18000,
  });

  const texts = await textSplitter.createDocuments([text]);

  const model = new OpenAI({
    modelName: "gpt-3.5-turbo-16k",
    temperature: 0,
    maxTokens: 40,
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
    inputVariables: ["text"],
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
    template:
      type === "summary"
        ? COMBINE_CUSTOM_PROMPT_SUMMARY
        : COMBINE_CUSTOM_PROMPT_OUTLINE,
    inputVariables: ["text"],
  });

  console.debug("Loading summarization chain");

  const chain = loadSummarizationChain(model, {
    type: "map_reduce",
    combineMapPrompt: mapPromptTemplate,
    combinePrompt: combinePromptTemplate,
  });

  console.debug("Summarizing w/ OpenAI");

  const timeNow = new Date().getTime();

  const res = await chain.call({
    input_documents: texts,
  });

  console.debug("OpenAI took", new Date().getTime() - timeNow, "ms");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  return (res as any).text as string;
}
