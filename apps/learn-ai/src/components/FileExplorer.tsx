import { api } from "~/utils/api";
import { FileCard } from "./FileCard";
import { useRouter } from "next/router";

export default function FileExplorer() {
  const { data: myFiles } = api.file.getAllUserFiles.useQuery();

  const router = useRouter();

  return (
    <>
      {myFiles?.map((file) => (
        <FileCard
          key={file.uid}
          file={file}
          onClick={() => {
            void router.push(`/file/${file.uid}`);
          }}
        />
      ))}
    </>
  );
}
