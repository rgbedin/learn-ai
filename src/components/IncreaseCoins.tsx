import { useMemo, useState } from "react";
import { UpsellModal } from "./UpsellModal";
import { api } from "~/utils/api";
import { BuyCoinsModal } from "./BuyCoinsModal";

export default function IncreaseCoins() {
  const [showModal, setShowModal] = useState(false);

  const { data: subsInfo } = api.user.getSubscriptionStatus.useQuery();

  const hasSub = useMemo(() => subsInfo?.isValid, [subsInfo]);

  return (
    <>
      <span
        className="ml-2 cursor-pointer text-sm text-blue-700 hover:underline"
        onClick={() => setShowModal(true)}
      >
        Want to increase your coins now?
      </span>

      {showModal && !hasSub && (
        <UpsellModal onClose={() => setShowModal(false)} />
      )}

      {showModal && hasSub && (
        <BuyCoinsModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
