/* eslint-disable react/no-unescaped-entities */
import { type SummaryType, type File } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import Languages from "helpers/assets/languages.json";
import CostDisplay from "./CostDisplay";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import UpgradeInline from "./UpgradeInline";
import { capitalize } from "lodash";
import { logEvent } from "~/hooks/useAmplitudeInit";
import { useI18n } from "~/locales";
import { getInfoForLanguage } from "helpers/getInfoForLanguage";
import { useRouter } from "next/router";

interface SummarizeOptions {
  file: File;
  type: SummaryType;
  onCancel: () => void;
  onNext: (
    language: string,
    pageStart?: number,
    pageEnd?: number,
    name?: string,
  ) => void;
}

export const SummarizeOptions: React.FC<SummarizeOptions> = ({
  file,
  type,
  onCancel,
  onNext,
}) => {
  const t = useI18n();

  const router = useRouter();

  const [name, setName] = useState<string>();
  const [language, setLanguage] = useState<string>(
    router.locale === "pt-BR" ? "pt-br" : "en",
  );
  const [pageStart, setPageStart] = useState<number>();
  const [pageEnd, setPageEnd] = useState<number>();
  const [hasEnoughCoins, setHasEnoughCoins] = useState<boolean>(true);

  const { data: subsInfo } = api.user.getSubscriptionStatus.useQuery();

  const { data: costCoins, isLoading: isLoadingCost } =
    api.file.getCostForSummary.useQuery({
      fileKey: file.key,
      pageEnd,
      pageStart,
    });

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

  const label = useMemo(
    () =>
      type === "SUMMARY"
        ? t("summary")
        : type === "OUTLINE"
        ? t("outline")
        : t("explanation"),
    [t, type],
  );

  useEffect(() => {
    setName(`${capitalize(label)} ${dayjs().format("hh:mmA DD/MM/YYYY")}`);
    setPageStart(1);
    const end = file.numPages && file.numPages > 5 ? 5 : file.numPages ?? 1;
    setPageEnd(end);
  }, [file, label]);

  const canProceed = useMemo(() => {
    if (hasPagesToSelect)
      return !!language && !invalidPages && !hasExceededMaxPages;
    return !!language;
  }, [hasPagesToSelect, language, invalidPages, hasExceededMaxPages]);

  const isNumPagesHigh = useMemo(
    () => !!pageStart && !!pageEnd && pageEnd - pageStart > 99,
    [pageStart, pageEnd],
  );

  const onCancelWrapper = () => {
    logEvent("CANCEL_SUMMARIZE", { file, type });
    onCancel();
  };

  const onNextWrapper = () => {
    logEvent("NEXT_SUMMARIZE", {
      file,
      type,
      language,
      pageStart,
      pageEnd,
      name,
    });
    onNext(language, pageStart, pageEnd, name);
  };

  return (
    <div className="relative flex h-full flex-col gap-6">
      <span className="text-xl font-light">
        {t("greatLetsWriteThis")} {label}!
      </span>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="countries"
          className="text-sm font-medium text-gray-900"
        >
          {t("whatNameShouldWeGiveThis")} {label}?
        </label>

        <input
          type="text"
          value={name}
          placeholder={t("typeNameHere")}
          onChange={(e) => setName(e.target.value)}
          className="input input-bordered text-sm focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="countries"
          className="text-sm font-medium text-gray-900"
        >
          {t("whichLanguageShouldWeUse")} {label}?
        </label>

        <span className="text-sm text-gray-600">
          {t("originalLanguageDoesNotMatter")}
        </span>

        <select
          id="countries"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="select select-bordered block w-full text-sm text-gray-900 focus:outline-none"
        >
          <option value={""}>{t("chooseALanguage")}</option>

          {Languages.languages.map((l) => (
            <option key={l.code} value={l.code}>
              {getInfoForLanguage(l.code, router.locale)?.language}
            </option>
          ))}
        </select>
      </div>

      {hasPagesToSelect && (
        <div className="flex flex-col gap-1">
          <label htmlFor="length" className="text-sm font-medium text-gray-900">
            {t("whichLanguageShouldWeUse")} {label}?
          </label>

          <div className="flex flex-row items-center gap-2">
            <span className="flex-shrink-0 items-center text-sm text-gray-600">
              {t("startPage")}
            </span>

            <input
              id="length"
              type="number"
              min={1}
              max={file.numPages ?? undefined}
              value={pageStart}
              onChange={(e) => setPageStart(parseInt(e.target.value))}
              className="input input-bordered w-full text-sm focus:outline-none"
            />
          </div>

          <div className="flex flex-row items-center gap-2">
            <span className="mr-2 flex-shrink-0 items-center text-sm text-gray-600">
              {t("endPage")}
            </span>

            <input
              id="length"
              type="number"
              min={1}
              max={file.numPages ?? undefined}
              value={pageEnd}
              onChange={(e) => setPageEnd(parseInt(e.target.value))}
              className="input input-bordered w-full text-sm focus:outline-none"
            />
          </div>

          {hasValidSub === false && (
            <div className="mt-2 rounded-sm bg-red-100 p-2">
              <span className="text-sm">
                {t("freeMembersPageLimit")} {maxNumberOfPagesAllowed}{" "}
                {t("pagesAtATime")}.
              </span>

              <UpgradeInline text={t("upgradeToUnlockAllPages")} />
            </div>
          )}

          {isNumPagesHigh && (
            <span className="text-sm text-red-800">
              {t("fastResultRecommendation")}
            </span>
          )}

          {invalidPages && (
            <span className="text-sm text-red-800">{t("invalidPages")}</span>
          )}
        </div>
      )}

      {!!canProceed && (
        <CostDisplay
          amount={costCoins}
          label={t("costDisplayLabel")}
          tooltip={t("tooltipCostDisplay")}
          onHasEnoughCoins={setHasEnoughCoins}
        />
      )}

      <div className="flex w-full justify-between">
        <button
          className="rounded bg-gray-300 px-6 py-3 text-sm font-bold uppercase text-gray-500 outline-none transition-all duration-150 ease-linear focus:outline-none"
          type="button"
          onClick={onCancelWrapper}
        >
          {t("cancel")}
        </button>

        <button
          disabled={!canProceed || !hasEnoughCoins || isLoadingCost}
          className="self-end rounded bg-[#003049] px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-[#003049] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={() => onNextWrapper()}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
};
