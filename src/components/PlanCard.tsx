/* eslint-disable react/no-unescaped-entities */

import { useMemo } from "react";

interface PlanCardProps {
  name: string;
  price: number;
  recurring: string;
  featuresEnabled: string[];
  featuresDisabled?: string[];
  discountCallout?: string;
  onSelect?: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  recurring,
  featuresEnabled,
  discountCallout,
  featuresDisabled,
  onSelect,
}) => {
  const bgStyle = useMemo(
    () => (price === 0 ? "bg-gray-200" : "bg-white"),
    [price],
  );

  return (
    <div
      className={`relative w-fit max-w-sm rounded-lg border border-gray-200 ${bgStyle} p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-4`}
    >
      <h5 className="mb-4 text-xl font-medium text-gray-500 dark:text-gray-400">
        {name}
      </h5>
      <div className="flex items-baseline text-gray-900 dark:text-white">
        <span className="text-3xl font-semibold">$</span>
        <span className="text-5xl font-extrabold tracking-tight">{price}</span>
        <span className="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">
          /{recurring}
        </span>
      </div>

      <ul role="list" className="my-7 space-y-3">
        {featuresEnabled.map((feature) => (
          <li key={feature} className="flex items-center space-x-3">
            <svg
              className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
            </svg>
            <span className="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">
              {feature}
            </span>
          </li>
        ))}

        {featuresDisabled?.map((feature) => (
          <li
            className="flex space-x-3 line-through decoration-gray-500"
            key={feature}
          >
            <svg
              className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
            </svg>
            <span className="text-base font-normal leading-tight text-gray-500">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900"
        >
          Choose Plan
        </button>
      )}

      {!onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex w-full cursor-not-allowed justify-center rounded-lg bg-gray-600 px-5 py-2.5 text-center text-sm font-medium text-white"
        >
          Current Plan
        </button>
      )}

      {discountCallout && (
        <div className="absolute right-0 top-0 mr-4 mt-4">
          <div className="flex items-center justify-center rounded-full bg-red-600">
            <span className="text-md p-2 font-medium text-white">
              {discountCallout}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
