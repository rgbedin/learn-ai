/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react/no-unescaped-entities */
import { PlanCard } from "./PlanCard";

interface UpsellModalProps {
  onClose: () => void;
}

export const UpsellModal: React.FC<UpsellModalProps> = ({ onClose }) => {
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
              <h3 className="text-lg font-semibold">Subscribe Now</h3>
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
                  <div className="hidden lg:flex">
                    <PlanCard
                      name="Free Plan"
                      featuresEnabled={[
                        "5 initial coins on signup",
                        "Upload PDF files only",
                        "Summarize up to 5 pages",
                      ]}
                      product="FREE"
                      featuresDisabled={[
                        "Upload image and audio files",
                        "Get audio file transcripts",
                        "Get handwritten notes text",
                        "Summarize unlimited pages",
                        "Create unlimited outlines and explanations",
                      ]}
                    />
                  </div>

                  <PlanCard
                    name="Montlhy Plan"
                    featuresEnabled={[
                      "50 coins per month",
                      "Upload PDF, image and audio files",
                      "Summarize unlimited pages",
                      "Get audio file transcripts",
                      "Get handwritten notes text",
                      "Create unlimited outlines and explanations",
                      "Get extra coins for $0.10",
                    ]}
                    product="SUBS_MONTHLY"
                    featuresDisabled={["Cheapest plan/month"]}
                  />

                  <PlanCard
                    name="Annual Plan"
                    featuresEnabled={[
                      "50 coins per month",
                      "Upload PDF, image and audio files",
                      "Summarize unlimited pages",
                      "Get audio file transcripts",
                      "Get handwritten notes text",
                      "Create unlimited outlines and explanations",
                      "Get extra coins for $0.10",
                      "Cheapest plan/month",
                    ]}
                    product="SUBS_YEARLY"
                    discountCallout="SAVE 15%"
                  />
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
