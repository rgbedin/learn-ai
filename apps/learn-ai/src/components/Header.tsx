import Image from "next/image";
import { type PropsWithChildren } from "react";

interface HeaderProps extends PropsWithChildren {
  imageSrc?: string;
}

export default function Header({ children, imageSrc }: HeaderProps) {
  return (
    <div className="rounded-dm flex w-fit items-center gap-1 rounded-full bg-[#cbcbcb] bg-opacity-25 p-2">
      <Image
        src={
          imageSrc ?? "https://public-learn-ai-m93.s3.amazonaws.com/note.png"
        }
        width={20}
        height={20}
        alt="Resumito"
        objectFit="contain"
      />

      <span className="font-md">{children}</span>
    </div>
  );
}
