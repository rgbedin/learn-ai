import React, { useState } from "react";
import { type File } from "@prisma/client";
import { api } from "~/utils/api";
import { FileIcon } from "./FileIcon";
import { BiSolidMessageSquareEdit } from "react-icons/bi";
import { humanFileSize } from "~/utils/humanFileSize";
import dayjs from "dayjs";

import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface FileCardProps {
  file: Omit<File, "summary" | "text" | "outline">;
  onClick: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onClick }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const { data } = api.file.getFileByUid.useQuery(file.uid, {
    refetchInterval(data) {
      return data?.hasProcessed ? false : 2000;
    },
  });

  const updateFile = api.file.updateFile.useMutation();

  const ctx = api.useContext();

  const isLoading = !data?.hasProcessed;

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
          setIsEditing(false);
        },
      },
    );
  };

  return (
    <div
      onClick={() => {
        if (!isEditing) {
          onClick();
        }
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="border-1 border-1 relative flex h-[200px] w-[190px] cursor-pointer flex-col items-center justify-between gap-4 border-gray-200 bg-white px-4 pb-4 pt-6 shadow-md transition hover:shadow-lg"
    >
      {!isLoading && <FileIcon type={file.type} size="lg" />}

      {isLoading && (
        <div className="h-16 w-14 animate-pulse rounded-md bg-gray-200" />
      )}

      {isHovering && (
        <div
          className="absolute right-1 top-1 cursor-pointer transition hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
        >
          <BiSolidMessageSquareEdit size={35} color="#003049" />
        </div>
      )}

      {!isEditing && (
        <div className="flex w-full flex-col">
          <span className="line-clamp-1">{file.name}</span>
          <span className="text-gray-500">{humanFileSize(file.size)}</span>
        </div>
      )}

      {isEditing && (
        <textarea
          autoFocus
          className="h-20 w-full resize-none rounded-md shadow-sm"
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

      {!data?.hasProcessed && (
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-200" />
      )}
    </div>
  );
};
