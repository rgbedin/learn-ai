import { api } from "~/utils/api";
import { GiTwoCoins } from "react-icons/gi";
import { useState } from "react";
import { UpsellModal } from "./UpsellModal";

export default function CoinsCard() {
  const [showModal, setShowModal] = useState(false);

  const { data: coins } = api.coins.getMyCoins.useQuery();

  return (
    <>
      <div className="flex gap-1 bg-orange-100 p-2">
        <GiTwoCoins size={22} />
        <span className="hidden text-sm lg:flex">You have</span>
        <span className="text-sm font-semibold">{coins}</span>
        <span className="text-sm">coins remaining</span>
        <span
          className="ml-2 cursor-pointer text-sm text-blue-700 hover:underline"
          onClick={() => setShowModal(true)}
        >
          Want to increase your coins?
        </span>
      </div>

      {showModal && <UpsellModal onClose={() => setShowModal(false)} />}
    </>
  );
}
