import type { GetStaticProps, NextPage } from "next";
import { api } from "~/utils/api";
import { PageBase } from "../../components/PageBase";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { useMemo, useState } from "react";
import { OptionPicker } from "~/components/OptionPicker";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import relativeTime from "dayjs/plugin/relativeTime";
import { SummaryView } from "~/components/SummaryView";
import { SummarizeModal } from "~/components/SummarizeModal";
import { OutlineView } from "~/components/OutlineView";
import { OutlineModal } from "~/components/OutlineModal";
import { ChatModal } from "~/components/ChatModal";
import { useRouter } from "next/router";

dayjs.extend(relativeTime);

type OptionType = "summarize" | "outline" | "chat";

export const FilePage: NextPage<{ uid: string }> = ({ uid }) => {
  const [optionSelected, setOptionSelected] = useState<OptionType>();

  const searchParams = useSearchParams();
  const summary = searchParams.get("summary");
  const outline = searchParams.get("outline");
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
              <object
                data={downloadUrl}
                type={file?.type}
                width="100%"
                height="100%"
              />
            )}
          </>
        )}
      </>
    );
  }, [downloadUrl, file?.type, file?.name, renderAsObject]);

  const router = useRouter();

  return (
    <>
      <PageBase showGoBack>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {documentViewer}

          <div className="flex flex-col gap-2">
            {summary && <SummaryView summaryUid={summary} />}

            {outline && <OutlineView outlineUid={outline} />}

            {chat && file && (
              <ChatModal
                file={file}
                chatUid={chat}
                onClose={() => {
                  void router.back();
                }}
              />
            )}

            {!summary && !outline && (
              <>
                <OptionPicker
                  fileUid={uid}
                  onSelectOption={setOptionSelected}
                />

                {optionSelected === "summarize" && file && (
                  <SummarizeModal
                    file={file}
                    onClose={() => setOptionSelected(undefined)}
                  />
                )}

                {optionSelected === "outline" && file && (
                  <OutlineModal
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
