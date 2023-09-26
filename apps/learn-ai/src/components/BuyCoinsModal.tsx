/* eslint-disable react/no-unescaped-entities */
import { api } from "~/utils/api";
import { useMemo, useState } from "react";
import getStripe from "~/utils/getStripe";
import toast from "react-hot-toast";
import { COINS_PER_BUNDLE } from "~/utils/constants";

interface BuyCoinsModalProps {
  onClose: () => void;
}

export const BuyCoinsModal: React.FC<BuyCoinsModalProps> = ({ onClose }) => {
  const [amount, setAmount] = useState<number>(1);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const { data: price } = api.stripe.getProductPrice.useQuery({
    product: "COIN",
  });

  const getCheckoutUrl = api.stripe.generateCheckoutUrl.useMutation();

  const onCheckout = () => {
    getCheckoutUrl.mutate(
      { amount, product: "COIN", origin: window.location.origin },
      {
        onSuccess: async (data) => {
          setIsLoadingUrl(true);

          const stripe = await getStripe();
          const { error } = await stripe!.redirectToCheckout({
            sessionId: data.id,
          });

          if (error) {
            toast.error(error.message ?? "An error occurred");
          }

          setIsLoadingUrl(false);
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  };

  const thePrice = useMemo(() => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      signDisplay: "never",
    });

    if (price) {
      return formatter.format((price / 100) * amount);
    }

    return formatter.format(0);
  }, [amount, price]);

  const actualAmount = useMemo(() => {
    return amount * 50;
  }, [amount]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none"
        onClick={onClose}
      >
        {/*content*/}
        <div className="relative mx-auto my-6 w-auto max-w-5xl">
          <div
            className="relative flex w-full min-w-[33vw] flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/*header*/}
            <div className="flex items-start justify-between rounded-t p-5">
              <h3 className="text-lg font-semibold">Get More Coins</h3>
              <button
                className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-5 outline-none focus:outline-none"
                onClick={onClose}
              >
                <span className="block h-6 w-6 bg-transparent text-2xl text-black outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>

            {/*body*/}
            <div className="relative flex-auto px-6 pb-6">
              <section className="container">
                <div className="flex flex-col gap-2">
                  <span>How many bundles do you want to buy?</span>

                  <span>
                    Each bundle contains{" "}
                    <span className="font-bold">{COINS_PER_BUNDLE} coins</span>.
                  </span>

                  <input
                    type="number"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    value={amount}
                    onChange={(e) => {
                      setAmount(parseInt(e.target.value));
                    }}
                  />

                  <button
                    className="w-full rounded-lg bg-[#003049] p-2 text-white  disabled:bg-gray-500"
                    onClick={onCheckout}
                    disabled={
                      getCheckoutUrl.isLoading ||
                      isLoadingUrl ||
                      !actualAmount ||
                      !price
                    }
                  >
                    {actualAmount && thePrice
                      ? price
                        ? `Buy ${actualAmount} coins for ${thePrice}`
                        : "Loading price..."
                      : "Select an amount first"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/*backdrop*/}
      <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
    </>
  );
};
