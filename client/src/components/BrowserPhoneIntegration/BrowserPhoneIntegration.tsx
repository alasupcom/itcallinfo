import { useState, useCallback, useEffect } from "react";
import ExactBrowserPhone from "./ExactBrowserPhone";
import Unmounted from "./shared/Unmounted";

export interface ConnectionStatus {
  isConnected: boolean;
  connectionStatusText: string;
  sipStatus: boolean;
  sipStatusText: string;
}

export default function BrowserPhoneIntegration() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectionStatusText: "Initializing...",
    sipStatus: false,
    sipStatusText: "Not Registered",
  });

  const [events, setEvents] = useState<string[]>([
    `${new Date().toLocaleTimeString()} - Container mounted`,
  ]);

  const addEvent = useCallback((eventText: string) => {
    setEvents((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${eventText}`]);
  }, []);

  const handleRefresh = useCallback(() => {
    addEvent("Refresh connection requested");
    if (window.RefreshRegister) {
      window.RefreshRegister();
      addEvent("SIP registration refreshed");
    }
  }, [addEvent]);

  const [isComponentMounted, setIsComponentMounted] = useState(true);

  const handleUnmount = useCallback(() => {
    addEvent("Component unmount requested");
    setIsComponentMounted(false);
  }, [addEvent]);

  const handleRemount = useCallback(() => {
    addEvent("Component remount requested");
    setIsComponentMounted(true);
  }, [addEvent]);

  // Subscribe to the window event to update the connection status
  useEffect(() => {
    const handlePhoneEvent = (event: CustomEvent) => {
      const { detail } = event;

      if (detail.event === "sipRegisterConnected") {
        setConnectionStatus({
          isConnected: true,
          connectionStatusText: "Connected",
          sipStatus: true,
          sipStatusText: "Registered",
        });
        addEvent("SIP connection established");
      } else if (detail.event === "sipRegisterDisconnected") {
        setConnectionStatus({
          isConnected: false,
          connectionStatusText: "Disconnected",
          sipStatus: false,
          sipStatusText: "Not Registered",
        });
        addEvent("SIP connection lost");
      }

      // Add more specific events as needed
      if (detail.event) {
        addEvent(`Event: ${detail.event}`);
      }
    };

    window.addEventListener("browser-phone-event", handlePhoneEvent as EventListener);
    return () => {
      window.removeEventListener("browser-phone-event", handlePhoneEvent as EventListener);
    };
  }, [addEvent]);

  return (
    <div className="flex flex-col h-full">
      <main className="flex-grow container mx-auto px-4 py-6 h-full">
        <div className="h-full">
          <div className="md:col-span-9 h-full">
            {isComponentMounted ? (
              <ExactBrowserPhone
                onInitialized={() => addEvent("BrowserPhone initialized")}
                onEvent={(event) => {
                  if (event.event) {
                    console.log("Phone event:", event.event);
                  }
                }}
              />
            ) : (
              <Unmounted handleRemount={handleRemount} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
