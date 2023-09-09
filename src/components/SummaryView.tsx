import { api } from "~/utils/api";

interface SummaryView {
  summaryUid: string;
}

export const SummaryView: React.FC<SummaryView> = ({ summaryUid }) => {
  const { data: summary } = api.file.getSummary.useQuery(summaryUid);

  return (
    <div className="relative flex h-full flex-col gap-6">
      <span className="text-xl font-light">
        {!summary ? "Loading..." : "Summary"}
      </span>

      {summary && (
        <div className="whitespace-pre-line rounded-md bg-gray-300 p-2">
          {summary.text}
        </div>
      )}
    </div>
  );
};
