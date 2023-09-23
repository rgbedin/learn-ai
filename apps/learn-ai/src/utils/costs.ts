import { type SummaryType } from "@prisma/client";
import { DEFAULT_AI_MODEL } from "helpers/ai-helpers/aiConstants";

const PRICE_PER_COIN = 0.1;
const PROFIT_MARGIN = 1.5;

const getPriceInCoinsWithProfitMargin = (price: number) => {
  return Math.ceil(Math.ceil(price / PRICE_PER_COIN) * PROFIT_MARGIN);
};

export const estimateCostForText = (text: string) => {
  const words = text.trim().split(" ").length;
  const tokensEstimate = words * 2;
  const costTokens =
    DEFAULT_AI_MODEL.pricePer1000Output * (tokensEstimate / 1000);

  console.debug(
    "Esimating cost for",
    words,
    "words",
    "Tokens esimated",
    tokensEstimate,
    "Cost tokens",
    costTokens,
  );

  return getPriceInCoinsWithProfitMargin(costTokens);
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
