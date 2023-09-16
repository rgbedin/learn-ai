import { useEffect } from "react";
import { api } from "~/utils/api";
import { logEvent } from "~/hooks/useAmplitudeInit";
import Header from "./Header";

interface TranscriptView {
  fileUid: string;
}

export const TranscriptView: React.FC<TranscriptView> = ({ fileUid }) => {
  const { data: file } = api.file.getFileByUid.useQuery(fileUid);

  useEffect(() => {
    logEvent("VIEW_TRANSCRIPT", { fileUid });
  }, [fileUid]);

  return (
    <div className="relative flex h-full flex-col gap-6">
      <Header>Transcript</Header>

      <div className="whitespace-pre-line rounded-md bg-[#cbcbcb] bg-opacity-20 p-2">
        {file?.text}
      </div>
    </div>
  );
};
