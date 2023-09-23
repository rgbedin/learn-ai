import type { GetStaticProps, NextPage } from "next";
import { api } from "~/utils/api";
import { PageBase } from "../../components/PageBase";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { useEffect, useMemo, useState } from "react";
import { OptionPicker, type OptionType } from "~/components/OptionPicker";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import relativeTime from "dayjs/plugin/relativeTime";
import { SummaryView } from "~/components/SummaryView";
import { SummarizeModal } from "~/components/SummarizeModal";
import { ChatModal } from "~/components/ChatModal";
import { useRouter } from "next/router";
import { useIsMobile } from "~/hooks/useIsMobile";
import { DownloadFile } from "~/components/DownloadFile";
import { logEvent } from "@amplitude/analytics-browser";
import { TranscriptView } from "~/components/TranscriptView";

dayjs.extend(relativeTime);

export const FilePage: NextPage<{ uid: string }> = ({ uid }) => {
  const [optionSelected, setOptionSelected] = useState<OptionType>();

  const searchParams = useSearchParams();
  const summary = searchParams.get("summary");
  const chat = searchParams.get("chat");
  const transcript = searchParams.get("transcript");

  const isInRootPage = !summary && !chat && !transcript;

  const router = useRouter();

  useEffect(() => {
    logEvent("VIEW_FILE_PAGE", { uid });
  }, [uid]);

  const { data: file } = api.file.getFileByUid.useQuery(
    {
      uid,
      getText: false,
    },
    {
      enabled: !!uid,
    },
  );

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

  const isMobile = useIsMobile();

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
                  height={"100%"}
                  style={{
                    minHeight: "70vh",
                  }}
                />
              </div>
            )}
          </>
        )}
      </>
    );
  }, [downloadUrl, renderAsObject, file?.type, file?.name]);

  return (
    <>
      <PageBase showGoBack>
        <div className="flex-1 flex-col gap-2 lg:grid lg:grid-cols-2">
          {!isMobile && documentViewer}

          {isMobile && isInRootPage && (
            <div className="mb-4">
              <DownloadFile fileKey={file?.key} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {summary && <SummaryView summaryUid={summary} />}

            {transcript && <TranscriptView fileUid={uid} />}

            {chat && file && (
              <ChatModal
                file={file}
                chatUid={chat}
                onClose={() => {
                  void router.back();
                }}
              />
            )}

            {isInRootPage && (
              <>
                <div className="flex flex-col gap-2">
                  <OptionPicker
                    fileUid={uid}
                    onSelectOption={setOptionSelected}
                  />
                </div>

                {!!optionSelected &&
                  optionSelected !== "chat" &&
                  optionSelected !== "transcript" &&
                  file && (
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
