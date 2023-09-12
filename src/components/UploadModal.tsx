import React, { type CSSProperties, useEffect, useMemo } from "react";
import axios from "axios";
import { useState } from "react";
import { api } from "~/utils/api";
import { toast } from "react-hot-toast";
import { FileIcon } from "./FileIcon";
import { useDropzone } from "react-dropzone";
import { humanFileSize } from "~/utils/humanFileSize";
import { GrFormClose } from "react-icons/gr";
import { BiUpload } from "react-icons/bi";
import { FeaturesCarousel } from "./FeaturesCarousel";
import { getCostUploadByFileType } from "~/utils/costs";
import CoinsDisplay from "./CoinsDisplay";

const dropzoneBaseStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
};

interface UploadModalProps {
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  const [file, setFile] = useState<File>();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [hasEnoughCoins, setHasEnoughCoins] = useState<boolean>(true);

  const { acceptedFiles, getRootProps, getInputProps, inputRef } = useDropzone({
    accept: {
      "image/*": ["png", "jpg", "jpeg"],
      "audio/*": ["mp3", "m4a", "wav"],
      "application/pdf": ["pdf"],
    },
    maxFiles: 1,
    maxSize: 20000000,
    onDropRejected: (err) => {
      toast.error(err[0]?.errors[0]?.message ?? "Invalid file type or size.");
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const dropzoneStyle = useMemo(
    () => ({
      ...dropzoneBaseStyle,
    }),
    [],
  );

  useEffect(() => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [acceptedFiles]);

  const createUploadUrl = api.file.createUploadUrl.useMutation();
  const onAfterUpload = api.file.onAfterUpload.useMutation();

  const ctx = api.useContext();

  const hasStartedUpload = uploadProgress > 0 && uploadProgress <= 100;

  const hasFinishedUpload = uploadProgress === 100;

  const costForFile = useMemo(() => {
    if (!file) return undefined;
    return getCostUploadByFileType(file.type);
  }, [file]);

  const clearFile = () => {
    inputRef.current?.value && (inputRef.current.value = "");
    setFile(undefined);
  };

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
        { key, name: file.name, type: file.type, size: file.size },
        {
          onSuccess: () => {
            void ctx.file.getAllUserFiles.invalidate();
            void ctx.coins.getMyCoins.invalidate();
            onClose();
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
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none"
        onClick={onClose}
      >
        {/*content*/}
        <div className="relative mx-auto my-6 w-auto max-w-3xl">
          <div
            className="relative flex w-full min-w-[33vw] flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/*header*/}
            <div className="flex items-start justify-between rounded-t p-5">
              <h3 className="text-lg font-semibold">Upload File</h3>
              <button
                className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-5 outline-none focus:outline-none"
                onClick={onClose}
              >
                <span className="block h-6 w-6 bg-transparent text-2xl text-black outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>

            {/*body*/}
            <div className="relative flex-auto px-6 pb-6">
              <section className="container">
                <FeaturesCarousel />

                <div {...getRootProps({ style: dropzoneStyle })}>
                  <input {...getInputProps()} />
                  <div className="flex cursor-pointer flex-col items-center justify-center gap-2 py-7">
                    <BiUpload size={35} />
                    <span className="text-sm">
                      Drag & Drop or Click to choose file.
                    </span>
                  </div>
                </div>

                {file && (
                  <div className="mt-4 flex flex-col rounded-md bg-gray-100 px-2 py-2">
                    <div className="flex justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <FileIcon
                          type={file.type}
                          previewUrl={null}
                          size="md"
                        />

                        <div className="flex flex-col justify-between gap-1">
                          <span className="line-clamp-1 text-sm">
                            {file.name}
                          </span>

                          <span className="text-sm text-gray-500">
                            {humanFileSize(file.size, true)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        {!hasStartedUpload && (
                          <div className="cursor-pointer" onClick={clearFile}>
                            <GrFormClose size={20} color="#9f9f9f" />
                          </div>
                        )}

                        {hasStartedUpload && (
                          <span className="rounded-lg bg-[#003049] p-1 text-xs text-white">
                            {uploadProgress}%
                          </span>
                        )}
                      </div>
                    </div>

                    {hasStartedUpload && (
                      <div className="mt-3 flex h-2 overflow-hidden rounded bg-[#002f4947] text-xs">
                        <div
                          style={{ width: `${uploadProgress}%` }}
                          className="flex flex-col justify-center whitespace-nowrap bg-[#003049] text-center  text-white shadow-none transition-width"
                        />
                      </div>
                    )}
                  </div>
                )}

                {!!costForFile && (
                  <div className="mt-4">
                    <CoinsDisplay
                      amount={costForFile}
                      label="This file will cost"
                      tooltip="Image and audio files require extra processing and will cost more to upload."
                      onHasEnoughCoins={setHasEnoughCoins}
                    />
                  </div>
                )}
              </section>
            </div>

            {/*footer*/}
            <div className="flex items-center justify-end rounded-b px-6 pb-6">
              <button
                className="background-transparent mb-1 mr-1 px-6 py-2 text-sm font-bold uppercase text-gray-500 outline-none transition-all duration-150 ease-linear focus:outline-none"
                type="button"
                onClick={onClose}
              >
                Close
              </button>

              {!hasFinishedUpload && (
                <button
                  disabled={!file || hasStartedUpload || !hasEnoughCoins}
                  className="mb-1 mr-1 rounded bg-[#003049] px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-[#003049] disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={() => void onUpload()}
                >
                  Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*backdrop*/}
      <div
        className="fixed inset-0 z-40 bg-black opacity-25"
        onClick={onClose}
      ></div>
    </>
  );
};
