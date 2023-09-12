/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable react/no-unescaped-entities */
import { type File } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import Languages from "~/assets/languages.json";

interface SummarizeOptions {
  file: File;
  onCancel: () => void;
  onNext: (language: string, pageStart?: number, pageEnd?: number) => void;
}

export const SummarizeOptions: React.FC<SummarizeOptions> = ({
  file,
  onCancel,
  onNext,
}) => {
  const [language, setLanguage] = useState<string>();
  const [pageStart, setPageStart] = useState<number>();
  const [pageEnd, setPageEnd] = useState<number>();

  const canSelectPages = useMemo(() => !!file.numPages, [file.numPages]);

  useEffect(() => {
    setPageStart(1);
    const end = file.numPages && file.numPages > 5 ? 5 : file.numPages ?? 1;
    setPageEnd(end);
  }, [file]);

  const canProceed = useMemo(() => {
    if (canSelectPages)
      return !!language && !!pageStart && !!pageEnd && pageStart <= pageEnd;
    return !!language;
  }, [canSelectPages, language, pageStart, pageEnd]);

  return (
    <div className="relative flex h-full flex-col gap-6">
      <span className="text-xl font-light">
        Great, let's write this summary!
      </span>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="countries"
          className="text-sm font-medium text-gray-900"
        >
          Which language should the summary be in?
        </label>

        <span className="text-sm text-gray-600">
          It does not matter the language the original file is in! Pick whatever
          suits you best.
        </span>

        <select
          id="countries"
          onChange={(e) => setLanguage(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        >
          <option selected value={""}>
            Choose a language
          </option>

          {Languages.languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.language}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="length" className="text-sm font-medium text-gray-900">
          Which pages should the summary be between?
        </label>

        <span className="text-sm text-gray-600">
          The shorter the summary, the more concise it will be and the lesser
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
            disabled={!canSelectPages}
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
            disabled={!canSelectPages}
            max={file.numPages ?? undefined}
            value={pageEnd}
            onChange={(e) => setPageEnd(parseInt(e.target.value))}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          />
        </div>

        {!canSelectPages && (
          <span className="text-sm text-red-800">
            We couldn't find the number of pages in this file, so we can only
            summarize the entire file.
          </span>
        )}
      </div>

      <div className="flex w-full justify-between">
        <button
          className="rounded bg-gray-300 px-6 py-3 text-sm font-bold uppercase text-gray-500 outline-none transition-all duration-150 ease-linear focus:outline-none"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          disabled={!canProceed}
          className="self-end rounded bg-[#003049] px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-[#003049] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={() => onNext(language!, pageStart, pageEnd)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
