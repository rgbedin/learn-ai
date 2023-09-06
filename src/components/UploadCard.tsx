import React, { useEffect } from "react";
import axios from "axios";
import { useRef, useState } from "react";
import { api } from "~/utils/api";
import { AiFillPlusCircle } from "react-icons/ai";
import { toast } from "react-hot-toast";
import { FileIcon } from "./FileIcon";

export const UploadCard: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [file, setFile] = useState<File>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createUploadUrl = api.file.createUploadUrl.useMutation();
  const onAfterUpload = api.file.onAfterUpload.useMutation();

  const ctx = api.useContext();

  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  const clearFile = () => {
    fileInputRef.current?.value && (fileInputRef.current.value = "");
    setFile(undefined);
  };

  useEffect(() => {
    if (uploadProgress === 100) {
      setTimeout(() => {
        setUploadProgress(0);
        clearFile();
      }, 0);
    }
  }, [uploadProgress]);

  const onUpload = async () => {
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

      toast.success(
        "File uploaded successfully. Please wait while we process it.",
        {
          duration: 5000,
        },
      );

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
      toast.error(
        `An error occurred when trying to upload the file. Please try again.`,
      );
    }
  };

  return (
    <div className="flex h-[250px] w-[250px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#003049] bg-white p-4">
      <input
        ref={fileInputRef}
        hidden
        type="file"
        className="flex-shrink-0"
        onChange={(e) => {
          if (!e.target.files?.[0]) return;

          const file = e.target.files[0];

          if (file.size > 100000000) {
            toast.error("File size cannot be greater than 100MB.");
            clearFile();
            return;
          }

          setFile(file);
        }}
        accept=".pdf, .docx, .png, .jpeg"
      />

      {!file && !isUploading && (
        <div
          className="cursor-pointer opacity-50 transition hover:opacity-100"
          onClick={() => fileInputRef.current?.click()}
        >
          <AiFillPlusCircle color="#003049" size={65} />
        </div>
      )}

      {file && (
        <div className="flex flex-col items-center justify-center gap-4">
          <FileIcon type={file.type} props={{ size: 55 }} />
          <span className="line-clamp-2 text-center font-light">
            {file.name}
          </span>
        </div>
      )}

      {file && !isUploading && (
        <div className="flex gap-2">
          <button
            className="rounded-md bg-slate-100 p-2"
            onClick={() => {
              clearFile();
            }}
          >
            Cancel
          </button>

          <button
            className="rounded-md border-gray-400 bg-black p-2 text-white "
            onClick={() => void onUpload()}
          >
            Upload
          </button>
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="relative w-full">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-right">
              <span className="inline-block rounded-full bg-[#003049] px-2 py-1 text-sm font-semibold uppercase text-white">
                {uploadProgress}%
              </span>
            </div>
          </div>

          <div className="mb-4 flex h-2 overflow-hidden rounded bg-[#002f4947] text-xs">
            <div
              style={{ width: `${uploadProgress}%` }}
              className="transition-width flex flex-col justify-center whitespace-nowrap bg-[#003049]  text-center text-white shadow-none"
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};
