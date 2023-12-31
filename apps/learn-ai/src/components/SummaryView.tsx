import { useEffect, useMemo, useState } from "react";
import { api } from "~/utils/api";
import { getInfoForLanguage } from "helpers/getInfoForLanguage";
import { Rating } from "react-simple-star-rating";
import toast from "react-hot-toast";
import { logEvent } from "~/hooks/useAmplitudeInit";
import Header from "./Header";
import Image from "next/image";
import { usePDF } from "react-to-pdf";
import { AiOutlineCloudDownload } from "react-icons/ai";
import { SummaryJobView } from "./SummaryJobView";
import { useI18n } from "~/locales";
import { capitalize } from "lodash";
import { useRouter } from "next/router";

interface SummaryView {
  summaryUid: string;
}

export const SummaryView: React.FC<SummaryView> = ({ summaryUid }) => {
  const t = useI18n();

  const [rating, setRating] = useState(0);

  const { data: summary } = api.file.getSummary.useQuery(summaryUid, {
    refetchInterval(data) {
      if (data?.status === "DONE" || data?.status === "ERROR") {
        return false;
      }

      return 1000;
    },
  });

  const { toPDF, targetRef } = usePDF({ filename: "resumito.pdf" });

  const { data: jobs } = api.file.getSummaryJobs.useQuery(
    { summaryUid },
    {
      refetchInterval(data) {
        const allJobsDone = data?.every(
          (j) => j.status === "DONE" || j.status === "ERROR",
        );

        if (allJobsDone && data && data.length > 0) {
          return false;
        }

        return 1000;
      },
    },
  );

  const sendRating = api.file.addRatingToSummary.useMutation();

  const isLoading = useMemo(
    () => summary?.status !== "DONE" && summary?.status !== "ERROR",
    [summary?.status],
  );

  const isPending = useMemo(
    () => summary?.status === "PENDING",
    [summary?.status],
  );

  const isReady = useMemo(
    () => summary?.status === "DONE" || summary?.status === "ERROR",
    [summary?.status],
  );

  const numJobsReady = useMemo(
    () =>
      jobs?.filter((j) => j.status === "DONE" || j.status === "ERROR").length ??
      0,
    [jobs],
  );

  const ctx = api.useContext();

  useEffect(() => {
    logEvent("VIEW_SUMMARY", { summaryUid });
  }, [summaryUid]);

  const onRatingChange = (rating: number) => {
    setRating(rating);
    sendRating.mutate(
      {
        rating,
        uid: summaryUid,
      },
      {
        onSuccess: () => {
          void ctx.file.getSummary.invalidate();
          toast.success(t("ratingSubmitted"));
        },
      },
    );
  };

  useEffect(() => {
    if (summary?.rating) {
      setRating(summary.rating);
    }
  }, [summary?.rating]);

  const label = useMemo(
    () =>
      summary?.type === "SUMMARY"
        ? capitalize(t("summary"))
        : summary?.type === "OUTLINE"
        ? capitalize(t("outline"))
        : capitalize(t("explanation")),
    [summary?.type, t],
  );

  const router = useRouter();

  return (
    <div className="relative flex h-full flex-col gap-6" ref={targetRef}>
      <Header>{summary?.name ?? label}</Header>

      {!isReady && (
        <div className="flex flex-col items-center justify-center gap-4">
          {!jobs ||
            (jobs.length < 10 && (
              <div className="alert w-fit">
                <span className="loading loading-spinner loading-sm"></span>
                <span>
                  {t("generatingYour")} {label}...
                </span>
              </div>
            ))}

          {jobs && jobs.length >= 10 && (
            <div className="alert alert-warning w-fit">
              <span className="loading loading-spinner loading-sm"></span>
              <div className="flex flex-col">
                <span>
                  {t("generatingYour")} {label}...
                </span>
                <span>
                  {t("thisMightTakeAWhile")} {label}.
                </span>
                <span>{t("youDoNotNeedLeaveThisPageOpen")}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {summary?.status === "ERROR" && (
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex flex-col">
            <span>{t("somePartsFailed")}</span>
            <span>
              {t("thisMightNotBeAccurate")} {label}.
            </span>
          </div>
        </div>
      )}

      {isReady && summary && (
        <div className="flex flex-col gap-1">
          <span>
            <span className="font-bold">{t("language")}: </span>
            {getInfoForLanguage(summary.language, router.locale)?.language}
          </span>

          {summary.pageStart && summary.pageEnd && (
            <span>
              <span className="font-bold">{t("pages")}: </span>
              {summary.pageStart}-{summary.pageEnd}
            </span>
          )}
        </div>
      )}

      {jobs?.map((j) => <SummaryJobView key={j.uid} jobUid={j.uid} />)}

      <button className="btn" onClick={() => toPDF()}>
        <AiOutlineCloudDownload size={24} />
        {t("downloadAsPdf")}
      </button>

      <div className="mt-1 flex flex-col">
        <span>
          {t("howGoodWasThis")} {label.toLocaleLowerCase()}?
        </span>
        <Rating
          emptyStyle={{ display: "flex" }}
          fillStyle={{ display: "-webkit-inline-box" }}
          readonly={!!summary?.rating}
          initialValue={rating}
          onClick={onRatingChange}
        />
        <span className="text-xs text-gray-500">
          {t("thisHelpsImproveQuality")}
        </span>
      </div>
    </div>
  );
};
