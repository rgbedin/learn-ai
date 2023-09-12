import { type SummaryType } from "@prisma/client";

export const getCostBySummaryTypeAndPages = (
  summaryType: SummaryType,
  pageStart?: number,
  pageEnd?: number,
) => {
  return 1;
};

export const getCostUploadByFileType = (fileType: string) => {
  if (fileType.includes("image") || fileType.includes("audio")) return 1;

  return 0;
};
