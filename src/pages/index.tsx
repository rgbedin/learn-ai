import { PageBase } from "../components/PageBase";
import { UploadCard } from "~/components/UploadCard";
import FileExplorer from "~/components/FileExplorer";
import RecentSummaries from "~/components/RecentSummaries";
import { api } from "~/utils/api";
import CoinsCard from "~/components/CoinsCard";
import SupportCard from "~/components/SupportCard";
import { useIsMobile } from "~/hooks/useIsMobile";
import { useEffect } from "react";
import useAmplitudeInit, { logEvent } from "~/hooks/useAmplitudeInit";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { data: recentSummaries } = api.file.getRecentSummaries.useQuery();

  const isMobile = useIsMobile();

  const { user } = useUser();

  useAmplitudeInit(user?.id);

  useEffect(() => {
    logEvent("VIEW_HOME_PAGE");
  }, []);

  return (
    <PageBase>
      <div className="flex flex-col gap-4">
        <CoinsCard />

        {!!recentSummaries && recentSummaries.length > 0 && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-md -ml-3 w-fit rounded-sm bg-[#003049] p-1 pl-4 pr-2 font-light text-white">
                Latest Generations
              </span>
              <RecentSummaries />
            </div>

            <hr className="w-full text-gray-500" />
          </>
        )}

        <div className="flex flex-col gap-2">
          <span className="-ml-3 w-fit rounded-sm bg-[#003049] p-1 pl-4 pr-2 text-lg font-light text-white">
            Your Files
          </span>

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
