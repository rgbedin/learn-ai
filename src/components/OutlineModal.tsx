/* eslint-disable react/no-unescaped-entities */
import { type File } from "@prisma/client";
import { useState } from "react";
import { OutlineOptions } from "./OutlineOptions";
import { OutlineResult } from "./OutlineResult";

interface OutlineModal {
  file: File;
  onClose: () => void;
}

export const OutlineModal: React.FC<OutlineModal> = ({ file, onClose }) => {
  const [language, setLanguage] = useState<string>();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
        {/*content*/}
        <div className="relative mx-auto my-6 w-auto max-w-3xl">
          <div
            className="relative flex w-full min-w-[33vw] flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/*header*/}
            <div className="flex items-start justify-between rounded-t p-5">
              <h3 className="text-lg font-semibold">Summarize File</h3>
              <button
                className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-5 outline-none focus:outline-none"
                onClick={onClose}
              >
                <span className="block h-6 w-6 bg-transparent text-2xl text-black outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>

            {/*body*/}
            <div className="relative flex-auto px-6 pb-6">
              <section className="container">
                {!language && (
                  <OutlineOptions
                    file={file}
                    onCancel={onClose}
                    onNext={(language) => {
                      setLanguage(language);
                    }}
                  />
                )}

                {language && (
                  <OutlineResult file={file} languageCode={language} />
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/*backdrop*/}
      <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
    </>
  );
};
