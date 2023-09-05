import axios from "axios";
import { useRef } from "react";
import { api } from "~/utils/api";
import { FileCard } from "./components/FileCard";
import { PageBase } from "./components/PageBase";
import { useRouter } from "next/router";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createUploadUrl = api.file.createUploadUrl.useMutation();
  const onAfterUpload = api.file.onAfterUpload.useMutation();

  const { data: myFiles } = api.file.getAllUserFiles.useQuery();

  const ctx = api.useContext();

  const router = useRouter();

  const onUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      const { url, key } = await createUploadUrl.mutateAsync({
        filename: file.name,
        filetype: file.type,
      });

      await axios.put(url, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      void onAfterUpload.mutateAsync(
        { key, name: file.name, type: file.type },
        {
          onSuccess: () => {
            void ctx.file.getAllUserFiles.invalidate();
          },
        },
      );
    } catch (error) {
      console.error(error);
      alert(`An error occurred`);
    }
  };

  return (
    <PageBase>
      <span>Upload File</span>
      <input ref={fileInputRef} type="file" accept=".pdf, .docx" />
      <button
        className="rounded-md border-gray-400 bg-slate-100 p-2"
        onClick={() => void onUpload()}
      >
        Upload
      </button>

      <div>
        <span>My Files</span>

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
      </div>
    </PageBase>
  );
}
