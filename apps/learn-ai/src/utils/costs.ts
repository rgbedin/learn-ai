import { type SummaryType } from "@prisma/client";

const PRICE_SUMMARY_PER_25_PAGES = 0.05;
const PRICE_PER_COIN = 0.1;
const PROFIT_MARGIN = 1.5;

const getPriceInCoinsWithProfitMargin = (price: number) => {
  return Math.ceil(Math.ceil(price / PRICE_PER_COIN) * PROFIT_MARGIN);
};

export const getCostBySummaryTypeAndPages = (
  summaryType: SummaryType,
  pageStart?: number,
  pageEnd?: number,
) => {
  const pages = pageEnd && pageStart ? pageEnd - pageStart : undefined;

  if (pages) {
    return getPriceInCoinsWithProfitMargin(
      (pages / 25) * PRICE_SUMMARY_PER_25_PAGES,
    );
  } else {
    return getPriceInCoinsWithProfitMargin(PRICE_SUMMARY_PER_25_PAGES * 2);
  }
};

const AUDIO_TRANSCRIBE_COST_PER_MINUTE = 0.024;

export const getCostUploadByFileType = (
  fileType: string,
  options?: {
    audioDurationInSeconds?: number;
  },
) => {
  if (fileType.includes("image")) return 2;

  if (fileType.includes("audio")) {
    const duration = options?.audioDurationInSeconds;

    if (!duration) throw new Error("Audio duration is required");

    return getPriceInCoinsWithProfitMargin(
      AUDIO_TRANSCRIBE_COST_PER_MINUTE * (duration / 60),
    );
  }

  return 0;
};
