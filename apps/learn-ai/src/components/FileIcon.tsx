/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from "react";
import { FileIcon as FIcon, defaultStyles } from "react-file-icon";
import mime from "mime-types";
import Image from "next/image";

interface FileIconProps {
  type: string;
  previewUrl: string | null;
  size: "sm" | "lg" | "md";
}

export const FileIcon: React.FC<FileIconProps> = ({
  type,
  size,
  previewUrl,
}) => {
  const ext = mime.extension(type) || "bin";

  const getStyle = () => {
    if (ext in defaultStyles) {
      return (defaultStyles as any)[ext];
    } else return {};
  };

  const sizes = {
    sm: "h-[25px] w-[25px]",
    lg: "h-[96px] w-[80px]",
    md: "h-[60px] w-[50px]",
  };

  return (
    <div className={`flex items-center ${sizes[size]}`}>
      {!previewUrl && <FIcon extension={ext} {...getStyle()} />}
      {previewUrl && (
        <Image src={previewUrl} height={120} width={120} alt="File" />
      )}
    </div>
  );
};
