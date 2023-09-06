import { api } from "~/utils/api";
import { FileCard } from "../components/FileCard";
import { PageBase } from "../components/PageBase";
import { useRouter } from "next/router";
import { UploadCard } from "~/components/UploadCard";

export default function Home() {
  const { data: myFiles } = api.file.getAllUserFiles.useQuery();

  const router = useRouter();

  return (
    <PageBase>
      <div className="flex flex-wrap gap-4">
        <UploadCard />

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
    </PageBase>
  );
}
