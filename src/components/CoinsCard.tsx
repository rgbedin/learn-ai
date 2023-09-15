import { api } from "~/utils/api";
import UpgradeInline from "./UpgradeInline";
import { useMemo } from "react";
import dayjs from "dayjs";
import { COINS_PER_MONTH } from "~/utils/constants";
import Image from "next/image";

export default function CoinsCard() {
  const { data: coins } = api.coins.getMyCoins.useQuery();
  const { data: subsInfo } = api.user.getSubscriptionStatus.useQuery();

  const nextRefill = useMemo(() => {
    if (subsInfo?.isValid) return coins?.nextRefill;
    return undefined;
  }, [subsInfo, coins]);

  return (
    <div className="flex flex-col gap-1 bg-orange-100 p-2 lg:flex-row">
      <div className="flex items-center gap-1">
        <Image
          src="https://public-learn-ai-m93.s3.amazonaws.com/coins.png"
          width={20}
          height={20}
          alt="coins"
        />
        <span className="hidden text-sm lg:flex">You have</span>
        <span className="text-sm font-semibold">{coins?.coins}</span>
        <span className="text-sm">coins remaining.</span>
      </div>

      {nextRefill && (
        <span className="text-sm">
          Your next refill of{" "}
          <span className="font-bold">{COINS_PER_MONTH}</span> coins is{" "}
          <span className="font-semibold">{dayjs(nextRefill).fromNow()}</span>.
        </span>
      )}

      <UpgradeInline />
    </div>
  );
}
