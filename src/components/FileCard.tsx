import React from "react";
import { type File } from "@prisma/client";
import { api } from "~/utils/api";

interface FileCardProps {
  file: File;
  onClick: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onClick }) => {
  const { data } = api.file.getFileByUid.useQuery(file.uid, {
    refetchInterval(data) {
      return data?.shortSummary ? false : 2000;
    },
  });

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-md bg-white p-4 transition hover:shadow-sm"
    >
      <span>{file.name}</span>
      <span>{file.type}</span>

      {!data?.shortSummary && <span>Loading...</span>}
      {data?.shortSummary && <span>{data?.shortSummary}</span>}
    </div>
  );
};
