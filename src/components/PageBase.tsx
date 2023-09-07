import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { type PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { AiOutlineUser } from "react-icons/ai";
import { BiArrowBack } from "react-icons/bi";

const theFont = Inter({ subsets: ["latin"] });

interface PageBaseProps extends PropsWithChildren {
  showGoBack?: boolean;
}

export const PageBase: React.FC<PageBaseProps> = ({ children, showGoBack }) => {
  const { user } = useUser();

  return (
    <main className={theFont.className}>
      <div className="flex h-auto min-h-screen flex-1 flex-col items-stretch  bg-gray-200 bg-opacity-90">
        <div className="z-10 flex h-[60px] flex-shrink-0 items-center justify-between rounded-b-xl bg-[#003049] p-4">
          <div className="flex flex-1 gap-1">
            <AiOutlineUser size={25} color="white" />
            <span className="text-white">{user?.fullName}</span>
          </div>

          <UserButton />
        </div>

        <div className="flex flex-1 grow flex-col p-2">
          {showGoBack && (
            <Link className="my-2 hover:underline" href="/">
              <span className="flex items-center gap-1">
                <BiArrowBack size={20} />
                Back
              </span>
            </Link>
          )}

          {children}
        </div>
      </div>
    </main>
  );
};
