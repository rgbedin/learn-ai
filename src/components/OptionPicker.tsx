import { useState } from "react";
import { OptionCard } from "~/components/OptionCard";
import { api } from "~/utils/api";
import { SummaryCard } from "./SummaryCard";
import { CreateNew } from "./CreateNewCard";
import { Transition } from "@headlessui/react";
import { OutlineCard } from "./OutlineCard";
import { ChatCard } from "./ChatCard";

export type OptionType = "summarize" | "outline" | "chat";

interface OptionPickerProps {
  fileUid: string;
  onSelectOption: (option: OptionType) => void;
}

export const OptionPicker: React.FC<OptionPickerProps> = ({
  fileUid,
  onSelectOption,
}) => {
  const [optionSelected, setOptionSelected] = useState<OptionType>();

  const { data: allSummaries } = api.file.getSummaries.useQuery({
    fileUid,
  });

  const { data: allOutlines } = api.file.getOutlines.useQuery({
    fileUid,
  });

  const { data: allChats } = api.file.getAllChats.useQuery({
    fileUid,
  });

  return (
    <div className="relative flex h-full flex-col gap-2">
      <div className="flex flex-col gap-1">
        <OptionCard
          title="Summarize Content"
          isSelected={optionSelected === "summarize"}
          onClick={() => setOptionSelected("summarize")}
          description="Summarize the content of the file. You can specify the length of the summary."
          imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-4-no-bg.png"
        />

        <Transition
          className="flex flex-col gap-1"
          show={optionSelected === "summarize"}
          enter="transition-all ease-in-out duration-300"
          enterFrom="h-0 opacity-0 translate-y-6"
          enterTo="h-100% opacity-100 translate-y-0"
          leave="transition-all ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="h-0 opacity-0"
        >
          <CreateNew
            label="Create New Summary"
            onClick={() => onSelectOption("summarize")}
          />

          {allSummaries?.map((summary) => (
            <SummaryCard key={summary.uid} summary={summary} />
          ))}
        </Transition>
      </div>

      <div className="flex flex-col gap-1">
        <OptionCard
          title="Create Outline"
          isSelected={optionSelected === "outline"}
          onClick={() => setOptionSelected("outline")}
          description="Create a bullet point outline of the file. Useful for quickly reviewing the content."
          imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-5-no-bg.png"
        />

        <Transition
          className="flex flex-col gap-1"
          show={optionSelected === "outline"}
          enter="transition-all ease-in-out duration-300"
          enterFrom="h-0 opacity-0 translate-y-6"
          enterTo="h-100% opacity-100 translate-y-0"
          leave="transition-all ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="h-0 opacity-0"
        >
          <CreateNew
            label="Create New Outline"
            onClick={() => onSelectOption("outline")}
          />

          {allOutlines?.map((outline) => (
            <OutlineCard key={outline.uid} outline={outline} />
          ))}
        </Transition>
      </div>

      <div className="flex flex-col gap-1">
        <OptionCard
          title="Ask Questions"
          isSelected={optionSelected === "chat"}
          onClick={() => setOptionSelected("chat")}
          description="Ask questions about the content of the file as if you were talking to a friendly expert."
          imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-6-no-bg.png"
        />

        <Transition
          className="flex flex-col gap-1"
          show={optionSelected === "chat"}
          enter="transition-all ease-in-out duration-300"
          enterFrom="h-0 opacity-0 translate-y-6"
          enterTo="h-100% opacity-100 translate-y-0"
          leave="transition-all ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="h-0 opacity-0"
        >
          <CreateNew
            label="Start New Chat"
            onClick={() => onSelectOption("chat")}
          />

          {allChats?.map((chat) => <ChatCard key={chat.uid} chat={chat} />)}
        </Transition>
      </div>
    </div>
  );
};
