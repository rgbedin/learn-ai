import { useState } from "react";
import { OptionCard } from "~/components/OptionCard";

export type OptionType = "summarize" | "outline" | "chat";

interface OptionPickerProps {
  onSelectOption: (option: OptionType) => void;
}

export const OptionPicker: React.FC<OptionPickerProps> = ({
  onSelectOption,
}) => {
  const [optionSelected, setOptionSelected] = useState<OptionType>();

  return (
    <div className="relative flex h-full flex-col gap-2">
      <OptionCard
        title="Summarize Content"
        isSelected={optionSelected === "summarize"}
        onClick={() => setOptionSelected("summarize")}
        description="Summarize the content of the file. You can specify the length of the summary."
        imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-4-no-bg.png"
      />

      <OptionCard
        title="Create Outline"
        isSelected={optionSelected === "outline"}
        onClick={() => setOptionSelected("outline")}
        description="Create a bullet point outline of the file. Useful for quickly reviewing the content."
        imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-5-no-bg.png"
      />

      <OptionCard
        title="Ask Questions"
        isSelected={optionSelected === "chat"}
        onClick={() => setOptionSelected("chat")}
        description="Ask questions about the content of the file as if you were talking to a friendly expert."
        imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-6-no-bg.png"
      />

      <button
        disabled={!optionSelected}
        className="mb-1 mr-1 self-end rounded bg-[#003049] px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-[#003049] disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        onClick={() => (optionSelected ? onSelectOption(optionSelected) : null)}
      >
        Next
      </button>
    </div>
  );
};
