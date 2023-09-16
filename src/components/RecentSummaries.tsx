import { api } from "~/utils/api";
import { SummaryCard } from "./SummaryCard";

export default function RecentSummaries() {
  const { data: recentSummaries } = api.file.getRecentSummaries.useQuery();

  if (!recentSummaries) {
    return null;
  }

  return (
    <div className="flex gap-1 overflow-x-auto">
      {recentSummaries.map((s) => (
        <SummaryCard
          key={s.uid}
          summary={s}
          fileName={s.file.name}
          fileType={s.file.type}
          fixedWidth
        />
      ))}
    </div>
  );
}
