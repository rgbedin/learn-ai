/* eslint-disable react/no-unescaped-entities */
import { type File } from "@prisma/client";
import { useState } from "react";
import Languages from "~/assets/languages.json";

interface SummarizeOptions {
  file: File;
  onCancel: () => void;
  onNext: (language: string, numParagraphs: number) => void;
}

export const SummarizeOptions: React.FC<SummarizeOptions> = ({
  onCancel,
  onNext,
}) => {
  const [language, setLanguage] = useState<string>();
  const [numParagraphs, setNumParagraphs] = useState<number>(5);

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
          How many paragraphs should the summary be?
        </label>

        <span className="text-sm text-gray-600">
          The shorter the summary, the more concise it will be and the lesser
          chances of it being accurate.
        </span>

        <input
          id="length"
          type="number"
          min={1}
          max={10}
          value={numParagraphs}
          onChange={(e) => setNumParagraphs(parseInt(e.target.value))}
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        />
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
          disabled={!language || !numParagraphs}
          className="self-end rounded bg-[#003049] px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-[#003049] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={() => onNext(language!, numParagraphs)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
