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
import Header from "~/components/Header";
import { getLocaleProps, useI18n } from "./locales";

export default function Home() {
  const t = useI18n();

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
              <Header>{t("header.latestGenerations")}</Header>
              <RecentSummaries />
            </div>

            <hr className="w-full text-gray-500" />
          </>
        )}

        <div className="flex flex-col gap-2">
          <Header imageSrc="https://public-learn-ai-m93.s3.amazonaws.com/books.png">
            {t("yourFiles")}
          </Header>

          <div className="flex flex-wrap gap-4">
            <UploadCard />

            <FileExplorer />
          </div>
        </div>
      </div>

      {!isMobile && (
        <div className="fixed bottom-2 right-2">
          <SupportCard />
        </div>
      )}
    </PageBase>
  );
}
