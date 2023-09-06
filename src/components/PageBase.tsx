import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { type PropsWithChildren } from "react";
import { Open_Sans } from "next/font/google";

const theFont = Open_Sans({ subsets: ["latin"] });

interface PageBaseProps extends PropsWithChildren {
  showGoBack?: boolean;
}

export const PageBase: React.FC<PageBaseProps> = ({ children, showGoBack }) => {
  const { user } = useUser();

  return (
    <main className={theFont.className}>
      <div className="flex h-auto min-h-screen flex-1 flex-col items-stretch">
        <div className="flex h-[50px] flex-shrink-0 items-center justify-between bg-[#003049] p-2">
          <span className="font-light text-white">Hello, {user?.fullName}</span>

          <UserButton />
        </div>

        <div className="flex flex-1 grow flex-col bg-slate-100 p-2">
          {showGoBack && <Link href="/">Go Back</Link>}

          {children}
        </div>
      </div>
    </main>
  );
};
