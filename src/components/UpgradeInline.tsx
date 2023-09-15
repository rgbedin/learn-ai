import { useMemo, useState } from "react";
import { UpsellModal } from "./UpsellModal";
import { api } from "~/utils/api";
import { BuyCoinsModal } from "./BuyCoinsModal";
import { logEventWrapper } from "~/hooks/useAmplitudeInit";

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
        onClick={logEventWrapper(
          () => setShowModal(true),
          "CLICK_UPGRADE_INLINE",
          { hasSubscription: hasSub },
        )}
      >
        {text}
      </span>

      {showModal && !hasSub && (
        <UpsellModal
          onClose={logEventWrapper(
            () => setShowModal(false),
            "CLOSE_UPSELL_MODAL",
          )}
        />
      )}

      {showModal && hasSub && (
        <BuyCoinsModal
          onClose={logEventWrapper(
            () => setShowModal(false),
            "CLOSE_BUY_COINS_MODAL",
          )}
        />
      )}
    </>
  );
}
