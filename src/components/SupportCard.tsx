/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { MdOutlineContactSupport } from "react-icons/md";

export default function SupportCard() {
  const [close, setClose] = useState(false);

  if (close) return null;

  return (
    <div className="max-w-sm  border border-gray-200 bg-white p-3 shadow dark:border-gray-700 dark:bg-gray-800">
      <MdOutlineContactSupport size={32} />

      <div
        onClick={() => setClose(true)}
        className="absolute right-3 top-2 cursor-pointer p-2"
      >
        <AiOutlineCloseCircle size={20} />
      </div>

      <a href="#">
        <h5 className="my-2 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          Have a question?
        </h5>
      </a>
      <p className="mb-3 text-sm font-light text-gray-500 dark:text-gray-400">
        We're here to help. Get in touch and we'll get back to you as soon as we
        can.
      </p>
      <a
        href="mailto:resumito.app@gmail.com"
        className="inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        Contact support
        <svg
          className="ml-2.5 h-3 w-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 18"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"
          />
        </svg>
      </a>
    </div>
  );
}
