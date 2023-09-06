import type { GetStaticProps, NextPage } from "next";
import { api } from "~/utils/api";
import { PageBase } from "../../components/PageBase";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

export const FilePage: NextPage<{ uid: string }> = ({ uid }) => {
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

  const { data: summary } = api.file.getSummary.useQuery(
    {
      key: file?.key ?? "",
    },
    {
      enabled: !!file?.key && !!downloadUrl,
      staleTime: Infinity,
    },
  );

  const renderAsObject =
    file?.type === "application/pdf" || file?.type.includes("audio/");

  return (
    <>
      <PageBase showGoBack>
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

        {summary && <div className="whitespace-pre-line">{summary}</div>}
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
