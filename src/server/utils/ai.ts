import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

export async function promptLongText(text: string, prompt: string) {
  // Create the text splitter and split the text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const texts = await textSplitter.createDocuments([text]);

  // Create the in-memory vector index and retriever
  const vectorIndex = await MemoryVectorStore.fromDocuments(
    texts,
    new OpenAIEmbeddings(),
  );
  const retriever = vectorIndex.asRetriever({
    searchType: "similarity",
    k: 6,
  });

  // Create the conversational interface
  const convInterface = ConversationalRetrievalQAChain.fromLLM(
    new ChatOpenAI(),
    retriever,
    {
      memory: new BufferMemory({
        memoryKey: "chat_history",
      }),
    },
  );

  // Create the chat history and query
  console.debug("Prompting OpenAI");
  const timeNow = new Date().getTime();
  const result = await convInterface.call({
    question: prompt,
  });
  console.debug("OpenAI took", new Date().getTime() - timeNow, "ms");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  return (result as any).text as string;
}
