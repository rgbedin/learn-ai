import { PageBase } from "../components/PageBase";
import { UploadCard } from "~/components/UploadCard";
import FileExplorer from "~/components/FileExplorer";

export default function Home() {
  return (
    <PageBase>
      <div className="flex flex-wrap gap-4">
        <UploadCard />

        <FileExplorer />
      </div>
    </PageBase>
  );
}
