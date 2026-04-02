import { useEffect, useRef } from "react";
import { sendHeartbeat } from "../services/api";

const useHeartbeat = (token, role) => {
  const intervalRef = useRef(null);

  useEffect(() => {
    // Only track heartbeats for students
    if (!token || role !== "student") return;

    const performHeartbeat = async () => {
      // Only ping if the tab is visible and focused
      if (document.visibilityState === "visible") {
        try {
          await sendHeartbeat(token);
        } catch (err) {
          console.error("Heartbeat failed", err);
        }
      }
    };

    // Send initial heartbeat
    performHeartbeat();

    // Start interval every 60 seconds
    intervalRef.current = setInterval(performHeartbeat, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, role]);
};

export default useHeartbeat;
