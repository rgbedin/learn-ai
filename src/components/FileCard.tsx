import React, { useState } from "react";
import { type File } from "@prisma/client";
import { api } from "~/utils/api";
import { FileIcon } from "./FileIcon";
import { BiSolidMessageSquareEdit } from "react-icons/bi";

interface FileCardProps {
  file: File;
  onClick: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onClick }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const { data } = api.file.getFileByUid.useQuery(file.uid, {
    refetchInterval(data) {
      return data?.shortSummary ? false : 2000;
    },
  });

  const updateFile = api.file.updateFile.useMutation();

  const ctx = api.useContext();

  const isLoading = !data?.shortSummary;

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
      className="relative flex h-[250px] w-[250px] cursor-pointer flex-col items-center justify-between gap-4 rounded-md bg-white p-4 shadow-sm transition hover:translate-y-[-5px]"
    >
      {!isLoading && (
        <FileIcon
          type={file.type}
          props={{ size: 55, style: { flexShrink: 0 } }}
        />
      )}

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
        <span className="line-clamp-2 text-center font-extralight">
          {file.name}
        </span>
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

      {!data?.shortSummary && (
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-200" />
      )}

      {data?.shortSummary && (
        <span className="line-clamp-3 text-sm font-light">
          {data?.shortSummary}
        </span>
      )}
    </div>
  );
};
