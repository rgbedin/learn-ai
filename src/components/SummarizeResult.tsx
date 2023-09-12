/* eslint-disable react/no-unescaped-entities */
import { type Summary, type File, type SummaryType } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { api } from "~/utils/api";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";

interface SummarizeResult {
  file: File;
  type: SummaryType;
  languageCode: string;
  pageStart?: number;
  pageEnd?: number;
  onClose: () => void;
}

export const SummarizeResult: React.FC<SummarizeResult> = ({
  file,
  type,
  languageCode,
  pageStart,
  pageEnd,
  onClose,
}) => {
  const [summary, setSummary] = useState<Summary>();

  const loadingSteps = useMemo(
    () => [
      "Bribing the Insight Imp for a concise extraction",
      "Unfurling the scrolls of Wisdom to begin",
      "The Content Conjurer is mixing the essence",
      "Whispering incantations to the Detail Djinn",
      "Negotiating with the Information Sprite",
      "Consulting the Wise Entity for a thorough check",
      "Enhancing the content with a dash of magic",
      "Seeking the Assistance of the Speedy Sprites",
      "Making final adjustments with the Precision Pen",
      "The Document Druid is finalizing your extract",
      "Hitching a ride on a Whimsical Wind to deliver your content",
    ],
    [],
  );

  const [activeStep, setActiveStep] = useState<string>(loadingSteps[0]!);

  const createSummary = api.file.generateSummary.useMutation();

  const ctx = api.useContext();

  useEffect(() => {
    console.debug(
      "Creating summary...",
      type,
      file.key,
      languageCode,
      pageStart,
      pageEnd,
    );

    createSummary.mutate(
      {
        type,
        key: file.key,
        languageCode,
        pageStart,
        pageEnd,
      },
      {
        onSuccess: (summary) => {
          void ctx.file.getSummaries.invalidate();
          void ctx.coins.getMyCoins.invalidate();
          setSummary(summary);
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.key, languageCode, pageStart, pageEnd]);

  useEffect(() => {
    if (!!summary) {
      return;
    }

    const updateLoadingStep = () => {
      const nextStepIndex = loadingSteps.indexOf(activeStep) + 1;

      if (nextStepIndex >= loadingSteps.length) {
        setActiveStep(loadingSteps[0]!);
      } else {
        setActiveStep(loadingSteps[nextStepIndex]!);
      }
    };

    const intervalId = setInterval(updateLoadingStep, 4000);

    return () => clearInterval(intervalId);
  }, [activeStep, summary, loadingSteps]);

  const router = useRouter();

  useEffect(() => {
    if (summary) {
      onClose();
      void router.push(`/file/${file.uid}?summary=${summary.uid}`);
    }
  }, [summary, file.uid, router, onClose]);

  return (
    <div className="relative flex h-full flex-col gap-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <Image
          src="https://public-learn-ai-m93.s3.amazonaws.com/img-wizard-no-bg.png"
          width={200}
          height={200}
          alt="wizard"
        />

        <div className="flex items-center gap-1">
          <div role="status">
            <svg
              aria-hidden="true"
              className="mr-2 h-8 w-8 animate-spin fill-blue-600 text-gray-400 dark:text-gray-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>

          <span className="text-lg font-light">{activeStep}</span>
        </div>
      </div>
    </div>
  );
};
