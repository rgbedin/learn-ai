import { type Summary } from "@prisma/client";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { getInfoForLanguage } from "~/utils/getInfoForLanguage";

interface SummaryCard {
  summary: Pick<
    Summary,
    "createdAt" | "language" | "numParagraphs" | "uid" | "fileUid"
  >;
}

export const SummaryCard: React.FC<SummaryCard> = ({ summary }) => {
  const router = useRouter();

  return (
    <div
      onClick={() =>
        void router.push(`/file/${summary.fileUid}?summary=${summary.uid}`)
      }
      key={summary.uid}
      className="flex cursor-pointer justify-between gap-4 rounded bg-white p-4 shadow"
    >
      <span>Summary</span>
      <span>
        {summary.numParagraphs} Paragraphs -{" "}
        {getInfoForLanguage(summary.language)?.language}{" "}
        {getInfoForLanguage(summary.language)?.emoji}
      </span>
      <span>{dayjs(summary.createdAt).fromNow()}</span>
    </div>
  );
};
