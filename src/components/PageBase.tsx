import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useMemo, type PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { BiArrowBack } from "react-icons/bi";
import { useRouter } from "next/router";
import CoinsCounter from "./CoinsCounter";
import { api } from "~/utils/api";
import Image from "next/image";
import LoadingOverlay from "./LoadingOverlay";
import toast from "react-hot-toast";

const theFont = Inter({ subsets: ["latin"] });

interface PageBaseProps extends PropsWithChildren {
  showGoBack?: boolean;
}

export const PageBase: React.FC<PageBaseProps> = ({ children, showGoBack }) => {
  const { data: subsData } = api.user.getSubscriptionStatus.useQuery();

  const isValid = useMemo(() => subsData?.isValid, [subsData]);

  const getBillingPortalUrl = api.stripe.generateBillingPortalUrl.useMutation();

  const router = useRouter();

  const onManageSubs = () => {
    getBillingPortalUrl.mutate(
      { origin: window.location.origin },
      {
        onSuccess: (data) => {
          const url = data.billingPortalUrl;
          window.open(url, "_blank");
        },
        onError: (err) => {
          console.error(err);
          toast.error("Error opening billing portal");
        },
      },
    );
  };

  return (
    <main className={theFont.className}>
      <div className="flex h-auto min-h-screen flex-1 flex-col items-stretch  bg-gray-100 bg-opacity-90">
        <div className="z-10 flex h-[60px] flex-shrink-0 items-center justify-between border-b-[1px] border-gray-200 bg-white p-4">
          <div className="flex flex-1 items-center gap-2">
            <Image
              src="https://public-learn-ai-m93.s3.amazonaws.com/resumito_black.png"
              width={130}
              height={20}
              alt="Resumito"
              objectFit="contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <CoinsCounter />

            {isValid && (
              <div className="flex items-center gap-1 rounded-md bg-orange-100 p-1 ">
                <Image
                  src="https://public-learn-ai-m93.s3.amazonaws.com/king.png"
                  width={18}
                  height={20}
                  alt="Premium"
                />

                <div className="flex-none">
                  <ul className="menu menu-horizontal p-0">
                    <li>
                      <details>
                        <summary className="p-0 pl-1 pr-2">Premium</summary>
                        <ul className="bg-base-100">
                          <li>
                            <a onClick={onManageSubs}>
                              {getBillingPortalUrl.isLoading ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : null}{" "}
                              Manage
                            </a>
                          </li>
                        </ul>
                      </details>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <UserButton />
          </div>
        </div>

        <div className="flex flex-1 grow flex-col p-2">
          {showGoBack && (
            <Link
              href="#"
              className="my-2 w-fit rounded-md border-[1px] border-[#003049] px-2 py-1 transition hover:bg-blue-100 "
              onClick={() => {
                router.back();
              }}
            >
              <span className="flex items-center gap-1">
                <BiArrowBack size={18} />
                Go Back
              </span>
            </Link>
          )}

          {children}
        </div>
      </div>

      <LoadingOverlay />
    </main>
  );
};
