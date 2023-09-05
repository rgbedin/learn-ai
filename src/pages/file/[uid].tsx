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

  return (
    <>
      <PageBase showGoBack>
        {downloadUrl && (
          <>
            {file?.type !== "application/pdf" && (
              <DocViewer
                prefetchMethod="GET"
                documents={[{ uri: downloadUrl }]}
                pluginRenderers={DocViewerRenderers}
              />
            )}

            {file?.type === "application/pdf" && (
              <object
                data={downloadUrl}
                type={file?.type}
                width="100%"
                height="100%"
              />
            )}
          </>
        )}

        {summary && (
          <div>
            <span>Summary:</span>
            <div>{summary}</div>
          </div>
        )}
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
