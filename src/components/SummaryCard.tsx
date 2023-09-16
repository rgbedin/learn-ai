import { type Summary } from "@prisma/client";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { getInfoForLanguage } from "~/utils/getInfoForLanguage";
import { FileIcon } from "./FileIcon";
import { logEventWrapper } from "~/hooks/useAmplitudeInit";

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
  fileType?: string;
}

export const SummaryCard: React.FC<SummaryCard> = ({
  summary,
  fileName,
  fixedWidth,
  fileType,
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
      onClick={logEventWrapper(
        () =>
          void router.push(`/file/${summary.fileUid}?summary=${summary.uid}`),
        "CLICK_SUMMARY_CARD",
        { summaryUid: summary.uid, summaryType: summary.type, fixedWidth },
      )}
      key={summary.uid}
      className={`relative flex cursor-pointer items-center justify-between gap-4 border-[1px]  bg-white p-4 text-sm ${style.width}`}
    >
      {fileName && (
        <div className="flex items-center gap-3">
          {fileType && <FileIcon type={fileType} size="sm" previewUrl={null} />}
          <span className="line-clamp-1">{fileName}</span>
        </div>
      )}

      {!fixedWidth && (
        <>
          <span className="line-clamp-1">
            {summary.pageStart && summary.pageEnd
              ? `Pages ${summary.pageStart}-${summary.pageEnd} `
              : label}
          </span>

          <span className="line-clamp-1">
            {getInfoForLanguage(summary.language)?.language}
          </span>

          <span className="line-clamp-1 text-xs font-semibold uppercase text-gray-500">
            {dayjs(summary.createdAt).fromNow()}
          </span>
        </>
      )}

      {fixedWidth && (
        <>
          <span className="line-clamp-1 flex-shrink-0 text-xs font-semibold uppercase text-gray-500">
            {typeLabel}
          </span>
        </>
      )}
    </div>
  );
};
