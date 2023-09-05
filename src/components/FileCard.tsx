import React from "react";
import { type File } from "@prisma/client";

interface FileCardProps {
  file: File;
  onClick: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-md bg-white p-4 transition hover:shadow-sm"
    >
      <span>{file.name}</span>
      <span>{file.type}</span>
    </div>
  );
};
