import { useEffect } from "react";
import { api } from "~/utils/api";
import { logEvent } from "~/hooks/useAmplitudeInit";

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
      <span className="text-md w-fit rounded-sm bg-[#003049] p-1 px-2 font-light text-white">
        Transcript
      </span>

      <div className="whitespace-pre-line rounded-md bg-gray-200 p-2">
        {file?.text}
      </div>
    </div>
  );
};
