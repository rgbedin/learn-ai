import axios from "axios";
import { useRef, useState } from "react";
import { api } from "~/utils/api";
import { FileCard } from "../components/FileCard";
import { PageBase } from "../components/PageBase";
import { useRouter } from "next/router";

export default function Home() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createUploadUrl = api.file.createUploadUrl.useMutation();
  const onAfterUpload = api.file.onAfterUpload.useMutation();

  const { data: myFiles } = api.file.getAllUserFiles.useQuery();

  const ctx = api.useContext();

  const router = useRouter();

  const onUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploadProgress(0);

    try {
      const { url, key } = await createUploadUrl.mutateAsync({
        filename: file.name,
        filetype: file.type,
      });

      await axios.put(url, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;

          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );

          setUploadProgress(percentCompleted);
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
      <input
        ref={fileInputRef}
        type="file"
        className="flex-shrink-0"
        accept=".pdf, .docx, .png, .jpeg"
      />
      <button
        className="rounded-md border-gray-400 bg-slate-100 p-2"
        onClick={() => void onUpload()}
      >
        Upload
      </button>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="relative pt-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-right">
              <span className="inline-block rounded-full bg-teal-200 px-2 py-1 text-xs font-semibold uppercase text-teal-600">
                {uploadProgress}%
              </span>
            </div>
          </div>
          <div className="mb-4 flex h-2 overflow-hidden rounded bg-teal-200 text-xs">
            <div
              style={{ width: `${uploadProgress}%` }}
              className="flex flex-col justify-center whitespace-nowrap bg-teal-500 text-center text-white shadow-none"
            ></div>
          </div>
        </div>
      )}

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
