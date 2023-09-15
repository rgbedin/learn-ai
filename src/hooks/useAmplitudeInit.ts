import { useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export let amplitude: typeof import("@amplitude/analytics-browser") | undefined;

const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

const useAmplitudeInit = (userId?: string) => {
  useEffect(() => {
    const initAmplitude = async () => {
      if (!amplitude) {
        amplitude = await import("@amplitude/analytics-browser");

        amplitude.init(AMPLITUDE_API_KEY!, undefined, {
          logLevel: amplitude.Types.LogLevel.Warn,
          defaultTracking: {
            sessions: true,
          },
        });
      }

      amplitude.setUserId(userId);
    };

    void initAmplitude();
  }, [userId]);
};

export const logEvent = (event: string, data?: Record<string, unknown>) => {
  if (!amplitude) {
    return;
  }
  amplitude.logEvent(event, data);
};

export const logEventWrapper = (
  fn: () => void,
  event: string,
  data?: Record<string, unknown>,
) => {
  return () => {
    fn();
    logEvent(event, data);
  };
};

export default useAmplitudeInit;
