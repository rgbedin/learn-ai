import { useEffect, useMemo, useState } from "react";
import { api } from "~/utils/api";
import { getInfoForLanguage } from "helpers/getInfoForLanguage";
import { Rating } from "react-simple-star-rating";
import toast from "react-hot-toast";
import { logEvent } from "~/hooks/useAmplitudeInit";
import Header from "./Header";
import Image from "next/image";

interface SummaryView {
  summaryUid: string;
}

export const SummaryView: React.FC<SummaryView> = ({ summaryUid }) => {
  const [rating, setRating] = useState(0);

  const { data: summary } = api.file.getSummary.useQuery(summaryUid, {
    refetchInterval(data) {
      if (data?.status === "DONE" || data?.status === "ERROR") {
        return false;
      }

      return 1000;
    },
  });

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
          toast.success("Rating submitted!");
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
        ? "Summary"
        : summary?.type === "OUTLINE"
        ? "Outline"
        : "Explanation",
    [summary?.type],
  );

  const progress = useMemo(() => {
    if (isPending) return 0;
    if (isLoading)
      return Math.floor((numJobsReady / (jobs?.length ?? 1)) * 100);
    return 100;
  }, [isPending, isLoading, numJobsReady, jobs?.length]);

  const progressLabel = useMemo(
    () =>
      jobs?.length
        ? `${numJobsReady} of ${jobs?.length ?? 0} wizard jobs ready...`
        : "Waiting to start...",
    [jobs?.length, numJobsReady],
  );

  return (
    <div className="relative flex h-full flex-col gap-6">
      <Header>{label}</Header>

      {!isReady && (
        <div className="flex flex-col items-center justify-center gap-4">
          {!jobs ||
            (jobs.length < 10 && (
              <div className="alert w-fit">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 shrink-0 stroke-info"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>Generating your {label}...</span>
              </div>
            ))}

          {jobs && jobs.length >= 10 && (
            <div className="alert alert-warning w-fit">
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
                <span>Generating your {label}...</span>
                <span>
                  This might take a while due to the size of the {label}.
                </span>
                <span>You do not need to leave this page open.</span>
              </div>
            </div>
          )}

          <Image
            src="https://public-learn-ai-m93.s3.amazonaws.com/waiting.png"
            width={110}
            height={110}
            alt="Loading"
          />

          <div
            className="radial-progress transition-all"
            style={
              {
                "--value": progress,
                "--size": "4rem",
                "--thickness": "5px",
              } as any
            }
          >
            {progress}%
          </div>

          <span className="text-xs uppercase text-gray-500">
            {progressLabel}
          </span>
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
            <span>Some parts of the text failed to be processed.</span>
            <span>This might not be an accurate {label}.</span>
          </div>
        </div>
      )}

      {isReady && summary && (
        <div className="flex flex-col gap-1">
          <span>
            <span className="font-bold">Language: </span>
            {getInfoForLanguage(summary.language)?.language}
          </span>

          {summary.pageStart && summary.pageEnd && (
            <span>
              <span className="font-bold">Pages: </span>
              {summary.pageStart}-{summary.pageEnd}
            </span>
          )}
        </div>
      )}

      {isReady && summary && (
        <>
          <div className="rounded-md bg-[#cbcbcb] bg-opacity-20 p-2">
            <div dangerouslySetInnerHTML={{ __html: summary.text! }} />
          </div>

          <div className="mt-1 flex flex-col">
            <span>How good was this {label.toLocaleLowerCase()}?</span>
            <Rating
              emptyStyle={{ display: "flex" }}
              fillStyle={{ display: "-webkit-inline-box" }}
              readonly={!!summary.rating}
              initialValue={rating}
              onClick={onRatingChange}
            />
            <span className="text-xs text-gray-500">
              This helps us improve the quality of our service.
            </span>
          </div>
        </>
      )}
    </div>
  );
};
