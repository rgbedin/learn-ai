import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // This code will only run on the client side after the component is mounted
    setIsMobile(window.innerWidth < 640);

    // Optional: If you want to update the isMobile state when the window is resized
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup the event listener when the component is unmounted
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}
