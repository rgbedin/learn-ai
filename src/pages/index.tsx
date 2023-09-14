import { PageBase } from "../components/PageBase";
import { UploadCard } from "~/components/UploadCard";
import FileExplorer from "~/components/FileExplorer";
import RecentSummaries from "~/components/RecentSummaries";
import { api } from "~/utils/api";
import CoinsCard from "~/components/CoinsCard";
import SupportCard from "~/components/SupportCard";
import { useIsMobile } from "~/hooks/useIsMobile";

export default function Home() {
  const { data: recentSummaries } = api.file.getRecentSummaries.useQuery();

  api.user.getSubscriptionStatus.useQuery();

  const isMobile = useIsMobile();

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

      {!isMobile && (
        <div className="absolute bottom-2 right-2">
          <SupportCard />
        </div>
      )}
    </PageBase>
  );
}
