/* eslint-disable react/no-unescaped-entities */
import React, { useMemo, useState } from "react";
import { type File } from "@prisma/client";
import { api } from "~/utils/api";
import { FileIcon } from "./FileIcon";
import { BiPencil, BiSolidMessageSquareEdit, BiTrash } from "react-icons/bi";
import { humanFileSize } from "~/utils/humanFileSize";
import dayjs from "dayjs";

import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-hot-toast";
import { useIsMobile } from "~/hooks/useIsMobile";
import { useI18n } from "~/locales";

dayjs.extend(relativeTime);

interface FileCardProps {
  file: Omit<File, "summary" | "text" | "outline" | "isDigitalContent">;
  onClick: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onClick }) => {
  const t = useI18n();

  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const { data } = api.file.getFileByUid.useQuery(
    {
      uid: file.uid,
      getText: false,
    },
    {
      refetchInterval(data) {
        return data?.hasProcessed ? false : 2000;
      },
    },
  );

  const updateFile = api.file.updateFile.useMutation();

  const deleteFile = api.file.deleteFile.useMutation();

  const ctx = api.useContext();

  const isLoading = !data?.hasProcessed;

  const onClickWrapper = () => {
    if (isLoading) {
      toast.error(t("fileStillProcessing"));
      return;
    }

    if (!isEditing) {
      onClick();
    }
  };

  const onUpdateFile = () => {
    updateFile.mutate(
      {
        uid: file.uid,
        name: newName,
      },
      {
        onSuccess() {
          void ctx.file.getFileByUid.invalidate();
          void ctx.file.getAllUserFiles.invalidate();
          void ctx.file.getRecentSummaries.invalidate();
          setIsEditing(false);
        },
      },
    );
  };

  const onDeleteFile = () => {
    deleteFile.mutate(
      {
        uid: file.uid,
      },
      {
        onSuccess() {
          (document.getElementById(deleteModalId) as any).close();
          void ctx.file.getFileByUid.invalidate();
          void ctx.file.getAllUserFiles.invalidate();
          void ctx.file.getRecentSummaries.invalidate();
          toast.success(t("fileDeleted"));
        },
        onError() {
          toast.error(t("somethinWentWrong"));
        },
      },
    );
  };

  const isMobile = useIsMobile();

  const sizeStyle = useMemo(() => {
    if (isMobile) {
      return "h-[200px] w-[calc(50%-10px)]";
    }
    return "h-[200px] w-[170px]";
  }, [isMobile]);

  const deleteModalId = useMemo(() => `delete_modal_${file.uid}`, [file]);

  return (
    <>
      <div
        onClick={onClickWrapper}
        onMouseEnter={isMobile ? undefined : () => setIsHovering(true)}
        onMouseLeave={isMobile ? undefined : () => setIsHovering(false)}
        className={`relative flex ${sizeStyle} cursor-pointer flex-col items-center justify-between gap-4 border-[1px] border-gray-200 bg-white px-4 pb-4 pt-6 transition hover:translate-y-[-3px]`}
      >
        {!isLoading && (
          <FileIcon type={file.type} previewUrl={data?.previewUrl} size="lg" />
        )}

        {isLoading && (
          <div className="h-24 w-24 animate-pulse rounded-md bg-gray-200" />
        )}

        {isHovering && (
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <div
              className="cursor-pointer transition hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                (document.getElementById(deleteModalId) as any).showModal();
              }}
            >
              <BiTrash size={25} color="#003049" />
            </div>

            <div
              className="cursor-pointer transition hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
            >
              <BiPencil size={25} color="#003049" />
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="flex w-full flex-col">
            <span className="line-clamp-1 text-sm">{file.name}</span>
            <span className="text-sm text-gray-500">
              {humanFileSize(file.size)}
            </span>
          </div>
        )}

        {isEditing && (
          <textarea
            autoFocus
            className="h-20 w-full resize-none rounded-md text-sm shadow-sm"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdateFile();
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onBlur={() => {
              onUpdateFile();
            }}
          />
        )}
      </div>

      <dialog id={deleteModalId} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">{t("areYouSure")}</h3>
          <p className="py-4">
            {t("thisWillPermanentlyDelete")} "{file.name}" {t("and")}{" "}
            <b>{t("allGeneratedDocuments")}</b>. {t("youWillNotGetCoinsBack")}
          </p>

          <div className="modal-action flex items-center justify-end gap-2">
            <form method="dialog">
              <button className="btn">{t("cancel")}</button>
            </form>

            <button className="btn btn-error" onClick={onDeleteFile}>
              {deleteFile.isLoading && (
                <span className="loading loading-spinner"></span>
              )}
              {t("delete")}
            </button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>{t("close")}</button>
        </form>
      </dialog>
    </>
  );
};
