import { useEffect, useMemo, useState } from "react";
import { api } from "~/utils/api";
import { getInfoForLanguage } from "~/utils/getInfoForLanguage";
import { Rating } from "react-simple-star-rating";
import toast from "react-hot-toast";
import { logEvent } from "~/hooks/useAmplitudeInit";
import Header from "./Header";

interface SummaryView {
  summaryUid: string;
}

export const SummaryView: React.FC<SummaryView> = ({ summaryUid }) => {
  const [rating, setRating] = useState(0);

  const { data: summary } = api.file.getSummary.useQuery(summaryUid);

  const sendRating = api.file.addRatingToSummary.useMutation();

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

  return (
    <div className="relative flex h-full flex-col gap-6">
      <Header>{!summary ? "Loading..." : label}</Header>

      {summary && (
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

      {summary && (
        <>
          <div className="whitespace-pre-line rounded-md bg-[#cbcbcb] bg-opacity-20 p-2">
            {summary.text}
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
