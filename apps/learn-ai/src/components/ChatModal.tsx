/* eslint-disable react/no-unescaped-entities */
import { type File, type ChatHistoryEntry } from "@prisma/client";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "~/utils/api";

interface ChatModal {
  file: File;
  chatUid?: string;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModal> = ({ file, chatUid, onClose }) => {
  const [question, setQuestion] = useState<string>("");
  const [chatHistoryEntries, setChatHistoryEntries] = useState<
    ChatHistoryEntry[]
  >([]);

  const { isLoading } = api.file.getChat.useQuery(
    {
      uid: chatUid ?? "",
    },
    {
      enabled: !!chatUid,
      onSuccess: (chat) => {
        setChatHistoryEntries(chat.history);
      },
    },
  );

  const askQuestion = api.file.askQuestion.useMutation();

  const lastChatHistoryEntry = useMemo(() => {
    if (chatHistoryEntries.length === 0) return undefined;

    return chatHistoryEntries[chatHistoryEntries.length - 1];
  }, [chatHistoryEntries]);

  const onSendQuestion = () => {
    if (!question) return;

    askQuestion.mutate(
      {
        fileUid: file.uid,
        question,
        chatUid: lastChatHistoryEntry?.chatUid,
      },
      {
        onSuccess: (chatHistoryEntry) => {
          setChatHistoryEntries([...chatHistoryEntries, chatHistoryEntry]);
          setQuestion("");
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
        {/*content*/}
        <div className="relative mx-auto my-6 w-auto max-w-3xl">
          <div
            className="relative flex w-full min-w-[33vw] flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/*header*/}
            <div className="flex items-start justify-between rounded-t p-5">
              <h3 className="text-lg font-semibold">Ask Questions</h3>
              <button
                className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-5 outline-none focus:outline-none"
                onClick={onClose}
              >
                <span className="block h-6 w-6 bg-transparent text-2xl text-black outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>

            {/*body*/}
            <div className="relative flex-auto px-6 pb-6">
              <section className="container">
                <div className="flex flex-col gap-4">
                  {chatHistoryEntries.map((chatHistoryEntry) => (
                    <div
                      key={chatHistoryEntry.uid}
                      className="flex flex-col gap-1"
                    >
                      <span className="font-semibold">
                        {chatHistoryEntry.question}
                      </span>
                      <span>{chatHistoryEntry.answer}</span>
                    </div>
                  ))}
                </div>

                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 rounded border border-gray-300 p-2"
                    placeholder="Ask a question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSendQuestion();
                      }
                    }}
                  />
                  <button
                    disabled={
                      !question ||
                      askQuestion.isLoading ||
                      (!!chatUid && isLoading)
                    }
                    className="ml-2 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-30"
                    onClick={onSendQuestion}
                  >
                    Send
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/*backdrop*/}
      <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
    </>
  );
};
