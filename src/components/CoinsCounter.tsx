import { api } from "~/utils/api";
import Image from "next/image";

export default function CoinsCounter() {
  const { data: coins } = api.coins.getMyCoins.useQuery();

  return (
    <div className="flex items-center gap-2 rounded-md bg-orange-100 px-1 py-[2px]">
      <Image
        src="https://public-learn-ai-m93.s3.amazonaws.com/coins.png"
        width={23}
        height={20}
        alt="coins"
      />
      <span className="py-[4px] pr-1 text-sm">{coins?.coins}</span>
    </div>
  );
}
