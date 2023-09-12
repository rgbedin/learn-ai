import { PageBase } from "../components/PageBase";
import { UploadCard } from "~/components/UploadCard";
import FileExplorer from "~/components/FileExplorer";
import RecentSummaries from "~/components/RecentSummaries";
import { api } from "~/utils/api";
import CoinsCard from "~/components/CoinsCard";

export default function Home() {
  const { data: recentSummaries } = api.file.getRecentSummaries.useQuery();

  return (
    <PageBase>
      <div className="flex flex-col gap-8">
        <CoinsCard />

        {!!recentSummaries && recentSummaries.length > 0 && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-lg font-light">Latest Documents</span>
              <RecentSummaries />
            </div>

            <hr className="w-full text-gray-500" />
          </>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-lg font-light">Your Files</span>

          <div className="flex flex-wrap gap-4">
            <UploadCard />

            <FileExplorer />
          </div>
        </div>
      </div>
    </PageBase>
  );
}
