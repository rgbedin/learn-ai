import { useMemo } from "react";
import { api } from "~/utils/api";
import { getInfoForLanguage } from "~/utils/getInfoForLanguage";

interface SummaryView {
  summaryUid: string;
}

export const SummaryView: React.FC<SummaryView> = ({ summaryUid }) => {
  const { data: summary } = api.file.getSummary.useQuery(summaryUid);

  const label = useMemo(
    () =>
      summary?.type === "SUMMARY"
        ? "Summary"
        : summary?.type === "OUTLINE"
        ? "Outline"
        : "Explanation",
    [summary?.type],
  );

  return (
    <div className="relative flex h-full flex-col gap-6">
      <span className="text-xl font-light">
        {!summary ? "Loading..." : label}
      </span>

      {summary && (
        <div className="flex flex-col gap-1">
          <span>
            {getInfoForLanguage(summary.language)?.language}{" "}
            {getInfoForLanguage(summary.language)?.emoji}
          </span>

          {summary.pageStart && summary.pageEnd && (
            <span>
              Pages {summary.pageStart}-{summary.pageEnd}
            </span>
          )}
        </div>
      )}

      {summary && (
        <div className="whitespace-pre-line rounded-md bg-gray-300 p-2">
          {summary.text}
        </div>
      )}
    </div>
  );
};
