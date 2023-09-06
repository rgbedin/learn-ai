import { api } from "~/utils/api";
import { FileCard } from "../components/FileCard";
import { useRouter } from "next/router";

export default function FileExplorer() {
  const { data: myFiles } = api.file.getAllUserFiles.useQuery();

  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-4">
      {myFiles?.map((file) => (
        <FileCard
          key={file.uid}
          file={file}
          onClick={() => {
            void router.push(`/file/${file.uid}`);
          }}
        />
      ))}
    </div>
  );
}
