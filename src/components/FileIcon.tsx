import React from "react";
import { BsFillFilePdfFill } from "react-icons/bs";
import { BsFillFileImageFill } from "react-icons/bs";
import { BsFillFileWordFill } from "react-icons/bs";
import { BsFillFileEarmarkFill } from "react-icons/bs";
import { BsFillFilePlayFill } from "react-icons/bs";
import { type IconBaseProps } from "react-icons";

interface FileIconProps {
  type: string;
  props?: IconBaseProps;
}

export const FileIcon: React.FC<FileIconProps> = ({ type, props }) => {
  if (type === "application/pdf") {
    return <BsFillFilePdfFill color="red" {...props} />;
  } else if (type.includes("image")) {
    return <BsFillFileImageFill {...props} />;
  } else if (type.includes("officedocument")) {
    return <BsFillFileWordFill color="blue" {...props} />;
  } else if (type.includes("audio")) {
    return <BsFillFilePlayFill color="green" {...props} />;
  } else {
    return <BsFillFileEarmarkFill {...props} />;
  }
};
