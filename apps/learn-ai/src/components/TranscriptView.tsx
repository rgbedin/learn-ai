import { useEffect } from "react";
import { api } from "~/utils/api";
import { logEvent } from "~/hooks/useAmplitudeInit";
import Header from "./Header";
import { useI18n } from "~/pages/locales";

interface TranscriptView {
  fileUid: string;
}

export const TranscriptView: React.FC<TranscriptView> = ({ fileUid }) => {
  const t = useI18n();

  const { data: file } = api.file.getFileByUid.useQuery({
    uid: fileUid,
    getText: true,
  });

  useEffect(() => {
    logEvent("VIEW_TRANSCRIPT", { fileUid });
  }, [fileUid]);

  return (
    <div className="relative flex h-full flex-col gap-6">
      <Header>{t("transcript")}</Header>

      <div className="whitespace-pre-line rounded-md bg-[#cbcbcb] bg-opacity-20 p-2">
        {file?.text}
      </div>
    </div>
  );
};
