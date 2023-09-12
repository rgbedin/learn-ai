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
  fileName?: string;
  fixedWidth?: boolean;
}

export const SummaryCard: React.FC<SummaryCard> = ({
  summary,
  fileName,
  fixedWidth,
}) => {
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

  const style = useMemo(
    () => ({
      width: fixedWidth ? "w-[400px]" : undefined,
    }),
    [fixedWidth],
  );

  const typeLabel = useMemo(
    () =>
      summary?.type === "SUMMARY"
        ? "Summary"
        : summary?.type === "OUTLINE"
        ? "Outline"
        : "Explanation",
    [summary?.type],
  );

  return (
    <div
      onClick={() =>
        void router.push(`/file/${summary.fileUid}?summary=${summary.uid}`)
      }
      key={summary.uid}
      className={`relative flex cursor-pointer items-center justify-between gap-4 border-[1px]  bg-white p-4 text-sm ${style.width}`}
    >
      {fileName && <span className="line-clamp-1">{fileName}</span>}

      {!fixedWidth && (
        <>
          <span className="line-clamp-1">
            {summary.pageStart && summary.pageEnd
              ? `Pages ${summary.pageStart}-${summary.pageEnd} `
              : label}
          </span>

          <span className="line-clamp-1">
            {getInfoForLanguage(summary.language)?.language}{" "}
            {getInfoForLanguage(summary.language)?.emoji}
          </span>

          <span className="line-clamp-1">
            {dayjs(summary.createdAt).fromNow()}
          </span>
        </>
      )}

      {fixedWidth && (
        <>
          <span className="line-clamp-1 text-xs font-semibold uppercase text-gray-500">
            {typeLabel}
          </span>
        </>
      )}
    </div>
  );
};
