import { api } from "~/utils/api";
import { GiTwoCoins } from "react-icons/gi";
import IncreaseCoins from "./IncreaseCoins";
import { useMemo } from "react";
import dayjs from "dayjs";

export default function CoinsCard() {
  const { data: coins } = api.coins.getMyCoins.useQuery();
  const { data: subsInfo } = api.user.getSubscriptionStatus.useQuery();

  const nextRefill = useMemo(() => {
    if (subsInfo?.isValid) return coins?.nextRefill;
    return undefined;
  }, [subsInfo, coins]);

  return (
    <div className="flex gap-1 bg-orange-100 p-2">
      <GiTwoCoins size={22} />
      <span className="hidden text-sm lg:flex">You have</span>
      <span className="text-sm font-semibold">{coins?.coins}</span>
      <span className="text-sm">coins remaining.</span>

      {nextRefill && (
        <span className="text-sm">
          Your next refill is {dayjs(nextRefill).fromNow()}.
        </span>
      )}

      <IncreaseCoins />
    </div>
  );
}
