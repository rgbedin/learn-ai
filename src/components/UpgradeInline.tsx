import { useMemo, useState } from "react";
import { UpsellModal } from "./UpsellModal";
import { api } from "~/utils/api";
import { BuyCoinsModal } from "./BuyCoinsModal";

interface UpgradeInlineProps {
  text?: string;
}

export default function UpgradeInline({
  text = "Want to increase your coins now?",
}: UpgradeInlineProps) {
  const [showModal, setShowModal] = useState(false);

  const { data: subsInfo } = api.user.getSubscriptionStatus.useQuery();

  const hasSub = useMemo(() => subsInfo?.isValid, [subsInfo]);

  return (
    <>
      <span
        className="cursor-pointer text-sm text-blue-700 hover:underline lg:ml-2"
        onClick={() => setShowModal(true)}
      >
        {text}
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
