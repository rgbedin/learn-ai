import type { GetStaticProps, NextPage } from "next";
import { api } from "~/utils/api";
import { PageBase } from "../../components/PageBase";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { useMemo, useState } from "react";
import { OptionPicker } from "~/components/OptionPicker";
import { Summarize } from "~/components/Summarize";

type OptionType = "summarize" | "outline" | "chat";

export const FilePage: NextPage<{ uid: string }> = ({ uid }) => {
  const [optionSelected, setOptionSelected] = useState<OptionType>();

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

  return (
    <>
      <PageBase showGoBack>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {documentViewer}

          {!optionSelected && (
            <OptionPicker onSelectOption={setOptionSelected} />
          )}

          {optionSelected === "summarize" && file && (
            <Summarize
              file={file}
              onCancel={() => setOptionSelected(undefined)}
            />
          )}
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
