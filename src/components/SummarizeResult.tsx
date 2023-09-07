/* eslint-disable react/no-unescaped-entities */
import { type File } from "@prisma/client";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { LoadingStep, type LoadingStepProps } from "./LoadingStep";

interface SummarizeResult {
  file: File;
  languageCode: string;
  numParagraphs: number;
}

export const SummarizeResult: React.FC<SummarizeResult> = ({
  file,
  languageCode,
  numParagraphs,
}) => {
  const [loadingSteps, setLoadingSteps] = useState<LoadingStepProps[]>([
    {
      text: "Summoning the Summary Wizard",
      isLoading: true,
    },
    {
      text: "Convincing the Summary Wizard to write your summary",
      isLoading: true,
    },
    {
      text: "The Summary Wizard is writing your summary",
      isLoading: true,
    },
    {
      text: "Packaging your summary in a nice box",
      isLoading: true,
    },
    {
      text: "Sending your summary to you",
      isLoading: true,
    },
  ]);

  const { data: summary, isLoading } = api.file.getSummary.useQuery({
    key: file.key,
    languageCode,
    numParagraphs,
  });

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const updateLoadingStep = () => {
      setLoadingSteps((prevSteps) => {
        const nextStepIndex = prevSteps.findIndex((step) => step.isLoading);

        if (nextStepIndex === -1) {
          return prevSteps;
        }

        const updatedSteps = [...prevSteps];

        updatedSteps[nextStepIndex] = {
          text: prevSteps[nextStepIndex]!.text,
          isLoading: false,
        };

        return updatedSteps;
      });
    };

    const intervalId = setInterval(updateLoadingStep, 3000);

    return () => clearInterval(intervalId);
  }, [isLoading]);

  return (
    <div className="relative flex h-full flex-col gap-6">
      <span className="text-xl font-light">
        {isLoading ? "Loading..." : "Summary"}
      </span>
      {isLoading && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-light text-gray-900">Summary status:</h2>

          <ul className="max-w-md list-inside space-y-2 text-black">
            {loadingSteps.map((step, i) => (
              <LoadingStep key={i} {...step} />
            ))}
          </ul>
        </div>
      )}
      {!isLoading && summary && (
        <div className="whitespace-pre-line rounded-md bg-gray-300 p-2">
          {summary}
        </div>
      )}
    </div>
  );
};
