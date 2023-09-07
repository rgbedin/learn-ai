/* eslint-disable react/no-unescaped-entities */
import { type File } from "@prisma/client";
import { useState } from "react";
import { SummarizeOptions } from "./SummarizeOptions";
import { SummarizeResult } from "./SummarizeResult";

interface Summarize {
  file: File;
  onCancel: () => void;
}

export const Summarize: React.FC<Summarize> = ({ file, onCancel }) => {
  const [language, setLanguage] = useState<string>();
  const [numParagraphs, setNumParagraphs] = useState<number>();

  return (
    <>
      {!language && (
        <SummarizeOptions
          file={file}
          onCancel={onCancel}
          onNext={(language, numParagraphs) => {
            setLanguage(language);
            setNumParagraphs(numParagraphs);
          }}
        />
      )}

      {language && numParagraphs && (
        <SummarizeResult
          file={file}
          languageCode={language}
          numParagraphs={numParagraphs}
        />
      )}
    </>
  );
};
