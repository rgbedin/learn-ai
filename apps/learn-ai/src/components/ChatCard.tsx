import { type Chat } from "@prisma/client";
import dayjs from "dayjs";
import { useRouter } from "next/router";

interface ChatCard {
  chat: Pick<Chat, "createdAt" | "uid" | "fileUid" | "firstQuestion">;
}

export const ChatCard: React.FC<ChatCard> = ({ chat }) => {
  const router = useRouter();

  return (
    <div
      onClick={() => void router.push(`/file/${chat.fileUid}?chat=${chat.uid}`)}
      key={chat.uid}
      className="flex cursor-pointer justify-between gap-4 rounded bg-white p-4 shadow"
    >
      <span>Chat</span>
      <span>{chat.firstQuestion}</span>
      <span>{dayjs(chat.createdAt).fromNow()}</span>
    </div>
  );
};
