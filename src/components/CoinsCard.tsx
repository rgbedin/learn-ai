import { api } from "~/utils/api";
import { GiTwoCoins } from "react-icons/gi";

export default function CoinsCard() {
  const { data: coins } = api.coins.getMyCoins.useQuery();

  return (
    <div className="flex gap-1 bg-orange-100 p-2">
      <GiTwoCoins size={22} />
      <span className="text-sm">You have</span>
      <span className="text-sm font-semibold">{coins}</span>
      <span className="text-sm">coins remaining</span>
    </div>
  );
}
