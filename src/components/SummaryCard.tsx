import { type Summary } from "@prisma/client";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { getInfoForLanguage } from "~/utils/getInfoForLanguage";

interface SummaryCard {
  summary: Pick<
    Summary,
    | "createdAt"
    | "language"
    | "pageStart"
    | "pageEnd"
    | "uid"
    | "fileUid"
    | "type"
  >;
}

export const SummaryCard: React.FC<SummaryCard> = ({ summary }) => {
  const router = useRouter();

  const label = useMemo(
    () =>
      summary.type === "SUMMARY"
        ? "Summary"
        : summary.type === "OUTLINE"
        ? "Outline"
        : "Explanation",
    [summary.type],
  );

  return (
    <div
      onClick={() =>
        void router.push(`/file/${summary.fileUid}?summary=${summary.uid}`)
      }
      key={summary.uid}
      className="flex cursor-pointer justify-between gap-4 rounded bg-white p-4 shadow"
    >
      <span>
        {summary.pageStart && summary.pageEnd
          ? `Pages ${summary.pageStart}-${summary.pageEnd} `
          : label}
      </span>
      <span>
        {getInfoForLanguage(summary.language)?.language}{" "}
        {getInfoForLanguage(summary.language)?.emoji}
      </span>
      <span>{dayjs(summary.createdAt).fromNow()}</span>
    </div>
  );
};
