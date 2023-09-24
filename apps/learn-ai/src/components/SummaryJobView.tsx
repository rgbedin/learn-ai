import { useMemo } from "react";
import { api } from "~/utils/api";

interface SummaryJobView {
  jobUid: string;
}

export const SummaryJobView: React.FC<SummaryJobView> = ({ jobUid }) => {
  const { data: content } = api.file.getSummaryJobContent.useQuery(
    {
      uid: jobUid,
    },
    {
      refetchInterval(data) {
        if (data?.status === "DONE" || data?.status === "ERROR") {
          return false;
        }

        return 1000;
      },
    },
  );

  const isReady = useMemo(
    () => content?.status === "DONE" || content?.status === "ERROR",
    [content?.status],
  );

  const isSuccess = useMemo(
    () => content?.status === "DONE",
    [content?.status],
  );

  if (content?.status === "ERROR") {
    return null;
  }

  return (
    <div className="flex flex-col">
      {!isReady && (
        <div role="status" className="max-w-sm animate-pulse">
          <div className="mb-4 h-2.5 w-48 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="mb-2.5 h-2 max-w-[360px] rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="mb-2.5 h-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="mb-2.5 h-2 max-w-[330px] rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="mb-2.5 h-2 max-w-[300px] rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-2 max-w-[360px] rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {isReady && content && (
        <>
          <span>
            {content?.index + 1}: <b>{content?.content?.title}</b>
          </span>

          {!content?.content?.outline && (
            <span>
              {content?.content?.summary ?? content?.content?.explanation}
            </span>
          )}

          {!!content?.content?.outline && (
            <ul>
              {content.content.outline.map((o, i) => (
                <li key={i}>• {o}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
