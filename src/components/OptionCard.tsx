import React from "react";
import Image from "next/image";

interface OptionCardProps {
  imageUrl: string;
  title: string;
  description: string;
  onClick: () => void;
  isSelected?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  imageUrl,
  title,
  description,
  onClick,
  isSelected,
}) => {
  const bg = isSelected ? "bg-blue-100" : "bg-white";
  const border = isSelected ? "border-blue-500" : "border-gray-200";
  const bgHover = isSelected ? "hover:bg-blue-200" : "hover:bg-gray-100";

  return (
    <div
      className={`flex cursor-pointer items-center gap-1 overflow-hidden rounded-md ${bg} border-2 p-2 ${border} ${bgHover} transition}`}
      onClick={onClick}
    >
      <Image src={imageUrl} height={125} width={125} alt="File Icon" />

      <div className="flex flex-col justify-between gap-2">
        <span className="text-xl">{title}</span>

        <span className="text-sm text-gray-500">{description}</span>
      </div>
    </div>
  );
};
