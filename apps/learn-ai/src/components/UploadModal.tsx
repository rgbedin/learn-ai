import React, { type CSSProperties, useMemo, useRef, useEffect } from "react";
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
import CostDisplay from "./CostDisplay";
import UpgradeInline from "./UpgradeInline";
import { logEvent } from "@amplitude/analytics-browser";
import { useI18n } from "~/locales";

const UPLOAD_LIMIT_FREE = 3000000;

const UPLOAD_LIMIT_PAID = 50000000;

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
  const t = useI18n();

  const [file, setFile] = useState<File>();
  const [audioDuration, setAudioDuration] = useState<number>();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [hasEnoughCoins, setHasEnoughCoins] = useState<boolean>();

  const { data: subsInfo } = api.user.getSubscriptionStatus.useQuery();

  const hasValidSub = useMemo(() => subsInfo?.isValid, [subsInfo]);

  const uploadLimit = useMemo(() => {
    if (hasValidSub) return UPLOAD_LIMIT_PAID;
    return UPLOAD_LIMIT_FREE;
  }, [hasValidSub]);

  const { getRootProps, getInputProps, inputRef } = useDropzone({
    accept: {
      "image/*": ["png", "jpg", "jpeg"],
      "audio/*": ["mp3", "m4a", "wav"],
      "application/pdf": ["pdf"],
    },
    maxFiles: 1,
    maxSize: uploadLimit,
    onDropRejected: (err) => {
      toast.error(err[0]?.errors[0]?.message ?? t("invalidFileTypeOrSize"));
    },
    onError(err) {
      toast.error(err.message);
    },
    onDrop(acceptedFiles) {
      setFile(undefined);

      logEvent("FILE_UPLOAD", {
        file: acceptedFiles[0]?.name,
        size: acceptedFiles[0]?.size,
        type: acceptedFiles[0]?.type,
      });

      setTimeout(() => {
        if (acceptedFiles.length > 0) {
          setFile(acceptedFiles[0]);
        }
      }, 0);
    },
  });

  const dropzoneStyle = useMemo(
    () => ({
      ...dropzoneBaseStyle,
    }),
    [],
  );

  const createUploadUrl = api.file.createUploadUrl.useMutation();
  const onAfterUpload = api.file.onAfterUpload.useMutation();

  const ctx = api.useContext();

  const hasStartedUpload = uploadProgress > 0 && uploadProgress <= 100;

  const hasFinishedUpload = uploadProgress === 100;

  const costForFile = useMemo(() => {
    if (!file) return undefined;

    if (file.type.includes("audio") && !audioDuration) return undefined;

    return getCostUploadByFileType(
      file.type,
      audioDuration
        ? { audioDurationInSeconds: Math.ceil(audioDuration) }
        : undefined,
    );
  }, [audioDuration, file]);

  useEffect(() => {
    if (costForFile === 0) {
      setHasEnoughCoins(true);
    }
  }, [costForFile]);

  const clearFile = () => {
    inputRef.current?.value && (inputRef.current.value = "");
    setAudioDuration(undefined);
    setFile(undefined);
  };

  const onUpload = async () => {
    if (!file) return;

    if (file.type.includes("audio") && !audioDuration) {
      toast.error(t("processingAudioFilePleaseWait"));
      return;
    }

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

      toast.success(t("fileUploadedPleaseWait"), {
        duration: 5000,
      });

      void onAfterUpload.mutateAsync(
        {
          key,
          name: file.name,
          type: file.type,
          size: file.size,
          options: {
            audioDurationInSeconds: audioDuration
              ? Math.ceil(audioDuration)
              : undefined,
          },
        },
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
      toast.error(t("anErrorOnUpload"));
    }
  };

  const audioRef = useRef<HTMLAudioElement>(null);

  const onLoadedAudio = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
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
              <h3 className="text-lg font-semibold">{t("uploadFile")}</h3>
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
                    <span className="text-sm">{t("dragAnDropOrClick")}</span>
                  </div>
                </div>

                {subsInfo?.isValid === false && (
                  <div className="mt-4 rounded-sm bg-red-100 p-2">
                    <span className="text-sm">
                      {t("freeMembersUploadLimit")} {humanFileSize(uploadLimit)}
                      .
                    </span>

                    <UpgradeInline text={t("upgradeToUploadLargerFiles")} />
                  </div>
                )}

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

                {file && file.type.includes("audio") && (
                  <audio ref={audioRef} hidden onLoadedMetadata={onLoadedAudio}>
                    <source src={URL.createObjectURL(file)} />
                  </audio>
                )}

                {!!costForFile && (
                  <div className="mt-4">
                    <CostDisplay
                      amount={costForFile}
                      label={
                        file?.type.includes("audio")
                          ? t("transcribingAudioWillCost")
                          : t("analyzingImageWillCost")
                      }
                      tooltip={t("tooltipAfterUpload")}
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
                {t("close")}
              </button>

              {!hasFinishedUpload && (
                <button
                  disabled={
                    !file || hasStartedUpload || hasEnoughCoins !== true
                  }
                  className="mb-1 mr-1 rounded bg-[#003049] px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-[#003049] disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={() => void onUpload()}
                >
                  {t("upload")}
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
