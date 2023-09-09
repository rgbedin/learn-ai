import { type Outline } from "@prisma/client";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { getInfoForLanguage } from "~/utils/getInfoForLanguage";

interface OutlineCard {
  outline: Pick<Outline, "createdAt" | "language" | "uid" | "fileUid">;
}

export const OutlineCard: React.FC<OutlineCard> = ({ outline }) => {
  const router = useRouter();

  return (
    <div
      onClick={() =>
        void router.push(`/file/${outline.fileUid}?outline=${outline.uid}`)
      }
      key={outline.uid}
      className="flex cursor-pointer justify-between gap-4 rounded bg-white p-4 shadow"
    >
      <span>Outline</span>
      <span>
        {getInfoForLanguage(outline.language)?.language}{" "}
        {getInfoForLanguage(outline.language)?.emoji}
      </span>
      <span>{dayjs(outline.createdAt).fromNow()}</span>
    </div>
  );
};
