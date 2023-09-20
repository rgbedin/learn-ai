/* eslint-disable react/no-unescaped-entities */
import { type SummaryType, type File } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import Languages from "~/assets/languages.json";
import { getCostBySummaryTypeAndPages } from "~/utils/costs";
import CostDisplay from "./CostDisplay";
import { api } from "~/utils/api";
import UpgradeInline from "./UpgradeInline";
import { logEvent } from "~/hooks/useAmplitudeInit";

interface SummarizeOptions {
  file: File;
  type: SummaryType;
  onCancel: () => void;
  onNext: (language: string, pageStart?: number, pageEnd?: number) => void;
}

export const SummarizeOptions: React.FC<SummarizeOptions> = ({
  file,
  type,
  onCancel,
  onNext,
}) => {
  const [language, setLanguage] = useState<string>("en");
  const [pageStart, setPageStart] = useState<number>();
  const [pageEnd, setPageEnd] = useState<number>();
  const [hasEnoughCoins, setHasEnoughCoins] = useState<boolean>(true);

  const { data: subsInfo } = api.user.getSubscriptionStatus.useQuery();

  const hasValidSub = useMemo(() => subsInfo?.isValid, [subsInfo]);

  const hasPagesToSelect = useMemo(() => !!file.numPages, [file.numPages]);

  const maxNumberOfPagesAllowed = useMemo(
    () => (hasValidSub === false ? 5 : Infinity),
    [hasValidSub],
  );

  const numOfPagesSelected = useMemo(
    () => (pageEnd ?? 0) - (pageStart ?? 0) + 1,
    [pageStart, pageEnd],
  );

  const hasExceededMaxPages = useMemo(
    () => numOfPagesSelected > maxNumberOfPagesAllowed,
    [numOfPagesSelected, maxNumberOfPagesAllowed],
  );

  const invalidPages = useMemo(
    () =>
      !pageStart ||
      !pageEnd ||
      pageStart > pageEnd ||
      pageStart <= 0 ||
      pageStart > (file.numPages ?? 1) ||
      pageEnd <= 0 ||
      pageEnd > (file.numPages ?? 1),
    [pageStart, pageEnd, file.numPages],
  );

  useEffect(() => {
    setPageStart(1);
    const end = file.numPages && file.numPages > 5 ? 5 : file.numPages ?? 1;
    setPageEnd(end);
  }, [file]);

  const canProceed = useMemo(() => {
    if (hasPagesToSelect)
      return !!language && !invalidPages && !hasExceededMaxPages;
    return !!language;
  }, [hasPagesToSelect, language, invalidPages, hasExceededMaxPages]);

  const isNumPagesHigh = useMemo(
    () => !!pageStart && !!pageEnd && pageEnd - pageStart > 24,
    [pageStart, pageEnd],
  );

  const label = useMemo(
    () =>
      type === "SUMMARY"
        ? "summary"
        : type === "OUTLINE"
        ? "outline"
        : "explanation",
    [type],
  );

  const costCoins = useMemo(() => {
    const coins = getCostBySummaryTypeAndPages(type, pageStart, pageEnd);
    return coins;
  }, [type, pageStart, pageEnd]);

  const onCancelWrapper = () => {
    logEvent("CANCEL_SUMMARIZE", { file, type });
    onCancel();
  };

  const onNextWrapper = (
    language: string,
    pageStart?: number,
    pageEnd?: number,
  ) => {
    logEvent("NEXT_SUMMARIZE", { file, type, language, pageStart, pageEnd });
    onNext(language, pageStart, pageEnd);
  };

  return (
    <div className="relative flex h-full flex-col gap-6">
      <span className="text-xl font-light">
        Great, let's write this {label}!
      </span>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="countries"
          className="text-sm font-medium text-gray-900"
        >
          Which language should the {label} be in?
        </label>

        <span className="text-sm text-gray-600">
          It does not matter the language the original file is in! Pick whatever
          suits you best.
        </span>

        <select
          id="countries"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        >
          <option value={""}>Choose a language</option>

          {Languages.languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.language}
            </option>
          ))}
        </select>
      </div>

      {hasPagesToSelect && (
        <div className="flex flex-col gap-1">
          <label htmlFor="length" className="text-sm font-medium text-gray-900">
            Which pages should the {label} be between?
          </label>

          <span className="text-sm text-gray-600">
            The shorter the {label}, the more concise it will be and the lesser
            chances of it being accurate.
          </span>

          <div className="flex flex-row items-center gap-2">
            <span className="flex-shrink-0 items-center text-sm text-gray-600">
              Start page:
            </span>

            <input
              id="length"
              type="number"
              min={1}
              max={file.numPages ?? undefined}
              value={pageStart}
              onChange={(e) => setPageStart(parseInt(e.target.value))}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-row items-center gap-2">
            <span className="mr-2 flex-shrink-0 items-center text-sm text-gray-600">
              End page:
            </span>

            <input
              id="length"
              type="number"
              min={1}
              max={file.numPages ?? undefined}
              value={pageEnd}
              onChange={(e) => setPageEnd(parseInt(e.target.value))}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            />
          </div>

          {hasValidSub === false && (
            <div className="mt-2 rounded-sm bg-red-100 p-2">
              <span className="text-sm">
                Free members can only generate {maxNumberOfPagesAllowed} pages.
              </span>

              <UpgradeInline text="Upgrade to a paid plan to unlock all pages." />
            </div>
          )}

          {isNumPagesHigh && (
            <span className="text-sm text-red-800">
              We recommend keeping the {label} under 25 pages to a more accurate
              result.
            </span>
          )}

          {invalidPages && (
            <span className="text-sm text-red-800">
              Please enter valid page numbers.
            </span>
          )}
        </div>
      )}

      {!!costCoins && !!canProceed && (
        <CostDisplay
          amount={costCoins}
          label={`Generating this ${label} will cost`}
          tooltip="Document generation requires us to communicate with an AI provider"
          onHasEnoughCoins={setHasEnoughCoins}
        />
      )}

      <div className="flex w-full justify-between">
        <button
          className="rounded bg-gray-300 px-6 py-3 text-sm font-bold uppercase text-gray-500 outline-none transition-all duration-150 ease-linear focus:outline-none"
          type="button"
          onClick={onCancelWrapper}
        >
          Cancel
        </button>

        <button
          disabled={!canProceed || !hasEnoughCoins}
          className="self-end rounded bg-[#003049] px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-[#003049] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={() => onNextWrapper(language, pageStart, pageEnd)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
