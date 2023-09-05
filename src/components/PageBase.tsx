import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { type PropsWithChildren } from "react";

interface PageBaseProps extends PropsWithChildren {
  showGoBack?: boolean;
}

export const PageBase: React.FC<PageBaseProps> = ({ children, showGoBack }) => {
  const { user } = useUser();

  return (
    <main className="flex h-auto min-h-screen flex-1 items-stretch bg-red-200">
      <div className="flex w-[250px] flex-shrink-0 flex-col bg-white p-2">
        Hello, {user?.fullName}
      </div>

      <div className="flex flex-1 grow flex-col bg-slate-200 p-2">
        {showGoBack && <Link href="/">Go Back</Link>}

        {children}
      </div>
    </main>
  );
};
