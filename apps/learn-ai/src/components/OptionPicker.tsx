import { useState } from "react";
import { OptionCard } from "~/components/OptionCard";
import { api } from "~/utils/api";
import { SummaryCard } from "./SummaryCard";
import { CreateNew } from "./CreateNewCard";
import { Transition } from "@headlessui/react";
import { type SummaryType } from "@prisma/client";
import { useRouter } from "next/router";
import { useI18n } from "~/locales";

export type OptionType = SummaryType | "chat" | "transcript";

interface OptionPickerProps {
  fileUid: string;
  onSelectOption: (option: OptionType) => void;
}

export const OptionPicker: React.FC<OptionPickerProps> = ({
  fileUid,
  onSelectOption,
}) => {
  const t = useI18n();

  const [optionSelected, setOptionSelected] = useState<OptionType>();

  const { data: allSummaries } = api.file.getSummaries.useQuery({
    fileUid,
    type: "SUMMARY",
  });

  const { data: allOutlines } = api.file.getSummaries.useQuery({
    fileUid,
    type: "OUTLINE",
  });

  const { data: allExplains } = api.file.getSummaries.useQuery({
    fileUid,
    type: "EXPLAIN",
  });

  const router = useRouter();

  return (
    <div className="relative flex  flex-col gap-2">
      <div className="flex flex-col gap-1">
        <OptionCard
          title={t("summarizeContent")}
          isSelected={optionSelected === "SUMMARY"}
          onClick={() => setOptionSelected("SUMMARY")}
          description={t("summarizeContentDesc")}
          imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-4-no-bg.png"
        />

        <Transition
          className="flex flex-col gap-1"
          show={optionSelected === "SUMMARY"}
          enter="transition-all ease-in-out duration-300"
          enterFrom="h-0 opacity-0 translate-y-6"
          enterTo="h-100% opacity-100 translate-y-0"
          leave="transition-all ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="h-0 opacity-0"
        >
          <CreateNew
            label={t("createNewSummary")}
            onClick={() => onSelectOption("SUMMARY")}
          />

          {allSummaries?.map((summary) => (
            <SummaryCard key={summary.uid} summary={summary} />
          ))}
        </Transition>
      </div>

      <div className="flex flex-col gap-1">
        <OptionCard
          title={t("createOutline")}
          isSelected={optionSelected === "OUTLINE"}
          onClick={() => setOptionSelected("OUTLINE")}
          description={t("createOutlineDesc")}
          imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-5-no-bg.png"
        />

        <Transition
          className="flex flex-col gap-1"
          show={optionSelected === "OUTLINE"}
          enter="transition-all ease-in-out duration-300"
          enterFrom="h-0 opacity-0 translate-y-6"
          enterTo="h-100% opacity-100 translate-y-0"
          leave="transition-all ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="h-0 opacity-0"
        >
          <CreateNew
            label={t("createNewOutline")}
            onClick={() => onSelectOption("OUTLINE")}
          />

          {allOutlines?.map((outline) => (
            <SummaryCard key={outline.uid} summary={outline} />
          ))}
        </Transition>
      </div>

      <div className="flex flex-col gap-1">
        <OptionCard
          title={t("explainLike12")}
          isSelected={optionSelected === "EXPLAIN"}
          onClick={() => setOptionSelected("EXPLAIN")}
          description={t("explainLike12Desc")}
          imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-6-no-bg.png"
        />

        <Transition
          className="flex flex-col gap-1"
          show={optionSelected === "EXPLAIN"}
          enter="transition-all ease-in-out duration-300"
          enterFrom="h-0 opacity-0 translate-y-6"
          enterTo="h-100% opacity-100 translate-y-0"
          leave="transition-all ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="h-0 opacity-0"
        >
          <CreateNew
            label={t("createNewExplanation")}
            onClick={() => onSelectOption("EXPLAIN")}
          />

          {allExplains?.map((exp) => (
            <SummaryCard key={exp.uid} summary={exp} />
          ))}
        </Transition>
      </div>

      <div className="flex flex-col gap-1">
        <OptionCard
          title={t("getATranscript")}
          isSelected={optionSelected === "transcript"}
          onClick={() => {
            void router.push(`/file/${fileUid}?transcript=true`);
          }}
          description={t("getATranscriptDesc")}
          imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/transcript-removebg-preview.png"
        />
      </div>
    </div>
  );
};
