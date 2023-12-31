/* eslint-disable react/no-unescaped-entities */
import Image from "next/image";
import { useState } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { useI18n } from "~/locales";

export default function SupportCard() {
  const t = useI18n();

  const [close, setClose] = useState(false);

  if (close) return null;

  return (
    <div className="max-w-sm  border border-gray-200 bg-white p-3 shadow dark:border-gray-700 dark:bg-gray-800">
      <Image
        src="https://public-learn-ai-m93.s3.amazonaws.com/mage_wiz.png"
        width={50}
        height={100}
        alt="Mage Wiz"
        objectFit="contain"
      />

      <div
        onClick={() => setClose(true)}
        className="absolute right-3 top-2 cursor-pointer p-2"
      >
        <AiOutlineCloseCircle size={20} />
      </div>

      <a href="#">
        <h5 className="my-2 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          {t("haveAQuestion")}
        </h5>
      </a>
      <p className="mb-3 text-sm font-light text-gray-500 dark:text-gray-400">
        {t("helpInstructions")}
      </p>
      <a
        href="mailto:resumito.app@gmail.com"
        className="inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        {t("contactSupport")}
        <svg
          className="ml-2.5 h-3 w-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 18"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"
          />
        </svg>
      </a>
    </div>
  );
}
