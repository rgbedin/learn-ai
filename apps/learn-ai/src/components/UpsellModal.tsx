/* eslint-disable react/no-unescaped-entities */
import { COINS_PER_MONTH, INITIAL_COINS } from "~/utils/constants";
import { PlanCard } from "./PlanCard";
import { useIsMobile } from "~/hooks/useIsMobile";
import { useEffect, useState } from "react";
import { useI18n } from "~/locales";

interface UpsellModalProps {
  onClose: () => void;
}

export const UpsellModal: React.FC<UpsellModalProps> = ({ onClose }) => {
  const t = useI18n();

  const [showPlans, setShowPlans] = useState<"all" | "monthly" | "yearly">(
    "all",
  );

  const isMobile = useIsMobile();

  useEffect(() => {
    console.debug("is mobile", isMobile);
  }, [isMobile]);

  useEffect(() => {
    console.debug("show plans", showPlans);
  }, [showPlans]);

  useEffect(() => {
    if (isMobile) {
      setShowPlans("monthly");
    } else {
      setShowPlans("all");
    }
  }, [isMobile]);

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
              <h3 className="text-lg font-semibold">{t("subscribeNow")}</h3>
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
                <div className="flex flex-col gap-2 lg:flex-row">
                  {isMobile && (
                    <select
                      id="plans"
                      value={showPlans}
                      onChange={(e) => setShowPlans(e.target.value as any)}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    >
                      <option value="monthly">{t("monthly")}</option>

                      <option value="yearly">{t("annual")}</option>
                    </select>
                  )}

                  {showPlans === "all" && (
                    <PlanCard
                      name={t("freePlan")}
                      featuresEnabled={[
                        `${INITIAL_COINS} ${t("initialCoinsOnSignuo")}`,
                        t("limit3MbPerFile"),
                        t("summarizeUpTo5Pages"),
                      ]}
                      product="FREE"
                      featuresDisabled={[
                        t("uploadImageAndAudioFiles"),
                        t("audioFileTranscripts"),
                        t("detectHandwrittenText"),
                        t("summarizeUnlimitedPages"),
                        t("noMoreCoins"),
                      ]}
                    />
                  )}

                  {(showPlans === "all" || showPlans === "monthly") && (
                    <PlanCard
                      name={t("monthlyPlan")}
                      featuresEnabled={[
                        `${COINS_PER_MONTH} ${t("coinsPerMonth")}`,
                        t("uploadFilesUpTo50Mb"),
                        t("audioFileTranscripts"),
                        t("handwrittenNotesTextDetection"),
                        t("Languages10Plus"),
                        t("summarizeUnlimitedPages"),
                        t("extraCoinsFor010K"),
                      ]}
                      product="SUBS_MONTHLY"
                      featuresDisabled={[t("cheapestPlan")]}
                    />
                  )}

                  {(showPlans === "all" || showPlans === "yearly") && (
                    <PlanCard
                      name={t("annualPlan")}
                      featuresEnabled={[
                        `${COINS_PER_MONTH} ${t("coinsPerMonth")}`,
                        t("uploadFilesUpTo50Mb"),
                        t("audioFileTranscripts"),
                        t("handwrittenNotesTextDetection"),
                        t("Languages10Plus"),
                        t("summarizeUnlimitedPages"),
                        t("extraCoinsFor010K"),
                        t("cheapestPlan"),
                      ]}
                      product="SUBS_YEARLY"
                      discountCallout={t("save20Percent")}
                    />
                  )}
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
