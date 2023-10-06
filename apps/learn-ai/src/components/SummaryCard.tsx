import { type Summary } from "@prisma/client";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { getInfoForLanguage } from "helpers/getInfoForLanguage";
import { FileIcon } from "./FileIcon";
import { logEventWrapper } from "~/hooks/useAmplitudeInit";
import { useI18n } from "~/locales";

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
    | "status"
    | "name"
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
  const t = useI18n();

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
      width: fixedWidth ? "w-[350px] max-w-[350px] min-w-[350px]" : undefined,
    }),
    [fixedWidth],
  );

  const typeLabel = useMemo(
    () =>
      summary?.type === "SUMMARY"
        ? t("summary")
        : summary?.type === "OUTLINE"
        ? t("outline")
        : t("explanation"),
    [summary?.type, t],
  );

  const isLoading = useMemo(
    () => summary?.status !== "DONE" && summary?.status !== "ERROR",
    [summary?.status],
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
          {fileType && !isLoading && (
            <FileIcon type={fileType} size="sm" previewUrl={null} />
          )}

          {isLoading && (
            <span className="loading loading-spinner loading-sm"></span>
          )}

          <span className="line-clamp-1">{summary.name ?? fileName}</span>
        </div>
      )}

      {!fixedWidth && (
        <>
          <div className="flex items-center gap-3">
            {isLoading && (
              <span className="loading loading-spinner loading-sm"></span>
            )}

            <div className="flex items-center gap-1">
              <span className="line-clamp-1">
                {!summary.name && summary.pageStart && summary.pageEnd
                  ? `${t("pages")} ${summary.pageStart}-${summary.pageEnd} `
                  : summary.name ?? label}
              </span>

              <span className="line-clamp-1">
                {getInfoForLanguage(summary.language)?.emoji}
              </span>
            </div>
          </div>

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
