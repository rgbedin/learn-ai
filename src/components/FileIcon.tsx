/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from "react";
import { FileIcon as FIcon, defaultStyles } from "react-file-icon";
import mime from "mime-types";

interface FileIconProps {
  type: string;
  size: "lg" | "md";
}

export const FileIcon: React.FC<FileIconProps> = ({ type, size }) => {
  const ext = mime.extension(type) || "bin";

  const getStyle = () => {
    if (ext in defaultStyles) {
      return (defaultStyles as any)[ext];
    } else return {};
  };

  const sizes = {
    lg: "h-[96px] w-[80px]",
    md: "h-[60px] w-[50px]",
  };

  return (
    <div className={`flex items-center ${sizes[size]}`}>
      <FIcon extension={ext} {...getStyle()} />
    </div>
  );
};
