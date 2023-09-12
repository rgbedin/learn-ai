import type { GetStaticProps, NextPage } from "next";
import { api } from "~/utils/api";
import { PageBase } from "../../components/PageBase";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { useMemo, useState } from "react";
import { OptionPicker, type OptionType } from "~/components/OptionPicker";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import relativeTime from "dayjs/plugin/relativeTime";
import { SummaryView } from "~/components/SummaryView";
import { SummarizeModal } from "~/components/SummarizeModal";
import { ChatModal } from "~/components/ChatModal";
import { useRouter } from "next/router";

dayjs.extend(relativeTime);

export const FilePage: NextPage<{ uid: string }> = ({ uid }) => {
  const [optionSelected, setOptionSelected] = useState<OptionType>();

  const searchParams = useSearchParams();
  const summary = searchParams.get("summary");
  const chat = searchParams.get("chat");

  const { data: file } = api.file.getFileByUid.useQuery(uid);

  const { data: downloadUrl } = api.file.getDownloadUrl.useQuery(
    {
      key: file?.key ?? "",
    },
    {
      enabled: !!file?.key,
      staleTime: Infinity,
    },
  );

  const renderAsObject = useMemo(
    () => file?.type === "application/pdf" || file?.type.includes("audio/"),
    [file?.type],
  );

  const isAudio = useMemo(() => file?.type.includes("audio/"), [file?.type]);

  const documentViewer = useMemo(() => {
    return (
      <>
        {downloadUrl && (
          <>
            {!renderAsObject && (
              <DocViewer
                prefetchMethod="GET"
                documents={[
                  {
                    uri: downloadUrl,
                    fileType: file?.type,
                    fileName: file?.name,
                  },
                ]}
                pluginRenderers={DocViewerRenderers}
              />
            )}

            {renderAsObject && (
              <div className="flex flex-shrink-0 flex-col gap-3">
                <object
                  data={downloadUrl}
                  type={file?.type}
                  height={isAudio ? undefined : "100%"}
                />

                {isAudio && (
                  <div className="flex flex-col gap-3">
                    <span className="text-lg font-light">Transcript</span>
                    <span className="whitespace-pre-line text-justify">
                      {file?.text}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </>
    );
  }, [
    downloadUrl,
    renderAsObject,
    file?.type,
    file?.name,
    file?.text,
    isAudio,
  ]);

  const router = useRouter();

  return (
    <>
      <PageBase showGoBack>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {documentViewer}

          <div className="flex flex-col gap-2">
            {summary && <SummaryView summaryUid={summary} />}

            {chat && file && (
              <ChatModal
                file={file}
                chatUid={chat}
                onClose={() => {
                  void router.back();
                }}
              />
            )}

            {!summary && (
              <>
                <OptionPicker
                  fileUid={uid}
                  onSelectOption={setOptionSelected}
                />

                {!!optionSelected && optionSelected !== "chat" && file && (
                  <SummarizeModal
                    type={optionSelected}
                    file={file}
                    onClose={() => setOptionSelected(undefined)}
                  />
                )}

                {optionSelected === "chat" && file && (
                  <ChatModal
                    file={file}
                    onClose={() => setOptionSelected(undefined)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </PageBase>
    </>
  );
};

export const getStaticProps: GetStaticProps = (context) => {
  const uid = context.params?.uid;

  if (typeof uid !== "string") throw new Error("no UID provided");

  return {
    props: {
      uid,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default FilePage;
