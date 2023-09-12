import { useEffect, useMemo } from "react";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { GiTwoCoins } from "react-icons/gi";
import { api } from "~/utils/api";

interface CoinsDisplayProps {
  amount: number;
  label: string;
  notEnoughCoinsMessage?: string;
  tooltip?: string;
  onHasEnoughCoins: (hasEnough: boolean) => void;
}

export default function CoinsDisplay({
  amount,
  label,
  tooltip,
  onHasEnoughCoins,
  notEnoughCoinsMessage = "You do not have enough coins",
}: CoinsDisplayProps) {
  const { data: coins } = api.coins.getMyCoins.useQuery();

  const hasEnoughCoins = useMemo(() => {
    if (!coins) return undefined;
    return coins >= amount;
  }, [coins, amount]);

  const bgStyle = useMemo(() => {
    if (hasEnoughCoins === undefined) return "bg-gray-200";
    if (hasEnoughCoins) return "bg-orange-100";
    return "bg-red-100";
  }, [hasEnoughCoins]);

  useEffect(() => {
    if (hasEnoughCoins !== undefined) onHasEnoughCoins(hasEnoughCoins);
  }, [hasEnoughCoins, onHasEnoughCoins]);

  return (
    <div className={`flex items-center gap-1 rounded-md px-2 py-2 ${bgStyle}`}>
      <GiTwoCoins size={22} />
      <span className="text-sm">
        {hasEnoughCoins === false ? notEnoughCoinsMessage : label}
      </span>

      <span className="text-sm font-semibold">{amount}</span>

      <span className="text-sm">coin{amount > 1 ? "s" : ""}</span>

      {tooltip && (
        <div className="group">
          <AiOutlineQuestionCircle size={16} className="text-gray-800" />
          <span
            className="absolute rounded-md bg-gray-800 p-2 
    text-sm text-gray-100 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {tooltip}
          </span>
        </div>
      )}
    </div>
  );
}
