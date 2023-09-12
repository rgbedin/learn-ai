import { api } from "~/utils/api";
import { GiTwoCoins } from "react-icons/gi";

export default function CoinsCounter() {
  const { data: coins } = api.coins.getMyCoins.useQuery();

  return (
    <div className="flex items-center gap-2 rounded-md bg-orange-100 px-1 py-[2px]">
      <GiTwoCoins size={22} />
      <span className="pr-1 text-sm">{coins}</span>
    </div>
  );
}
