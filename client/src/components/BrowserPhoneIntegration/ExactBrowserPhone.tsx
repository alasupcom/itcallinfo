import { useRef, useState, useEffect, useCallback } from 'react';
import BrowserPhoneStyles from './BrowserPhoneStyles';
import { Loader2 } from 'lucide-react';
import Unmounted from './shared/Unmounted';
import { useSipStore } from '@/store/sipStore';
import { config } from '@/Mocks/serverData';
// import BrowserPhoneStyles from './BrowserPhoneStyles';

interface ExactBrowserPhoneProps {
  onInitialized?: () => void;
  onEvent?: (event: any) => void;
}

export default function ExactBrowserPhone({ onInitialized, onEvent }: ExactBrowserPhoneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const configRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    connectionStatusText: 'Initializing...'
  });

  const { sipConfig, reconnect } = useSipStore();

  // Handle iframe messages and events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only handle messages from our iframe
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {

        // If iframe is requesting configuration
        if (event.data === 'requestConfig' && config) {
          console.log("Sending configuration to Browser-Phone");

          const websocketProtocol = config.transport === 'wss' ? 'wss://' : 'ws://';
          const websocketUrl = `${websocketProtocol}${config.server}:${config.port}${config.path}`;

          localStorage.setItem("wssServer", config.server);
          localStorage.setItem("WebSocketPort", String(config.port));
          localStorage.setItem("ServerPath", config.path);
          localStorage.setItem("profileName", config.username);
          localStorage.setItem("SipDomain", config.domain);
          localStorage.setItem("SipUsername", config.username);
          localStorage.setItem("SipPassword", config.password);

          // Send configuration to iframe
          iframeRef.current.contentWindow?.postMessage({
            type: 'phoneConfig',
            config: {
              webSocketUrl: websocketUrl,
              serverAddress: config.server,
              webSocketPort: config.port,
              serverPath: config.transport,
              sipUsername: config.username,
              sipPassword: config.password,
              sipDomain: config.domain,
              regExpires: 0,
              transport: config.transport,
              doRegistration: false
            }
          }, '*');
        }

        // Forward events from iframe to React
        if (event.data && event.data.event) {
          const customEvent = new CustomEvent('browser-phone-event', {
            detail: event.data
          });
          window.dispatchEvent(customEvent);

          if (onEvent) {
            onEvent(event.data);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    setLoading(false);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEvent, sipConfig]);

  // Subscribe to the window event to update the connection status
  useEffect(() => {
    const handlePhoneEvent = (event: CustomEvent) => {
      const { detail } = event;

      if (detail.event === "sipRegisterConnected") {
        setConnectionStatus({
          isConnected: true,
          connectionStatusText: "Connected"
        });
      } else if (detail.event === "sipRegisterDisconnected") {
        setConnectionStatus({
          isConnected: false,
          connectionStatusText: "Disconnected"
        });
      }
    };

    window.addEventListener("browser-phone-event", handlePhoneEvent as EventListener);
    return () => {
      window.removeEventListener("browser-phone-event", handlePhoneEvent as EventListener);
    };
  }, [sipConfig]);

  // Handle iframe load event
  const handleIframeLoad = useCallback(() => {
    console.log("Browser Phone iframe loaded");
    setLoading(false);

    if (!initialized.current) {
      initialized.current = true;

      // Call initialization callback
      if (onInitialized) {
        onInitialized();
      }
    }

    // Force the phone UI to be visible but for our component, no longer needed for UI display
    setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage("showPhoneUI", "*");
          console.log("Initialized phone interface");
        } catch (err) {
          console.error("Error initializing phone:", err);
        }
      }
    }, 500);
  }, [onInitialized]);

  const handleRemount = () => {
    console.log("error with phone interface", error);
    reconnect();
  };

  if (error) {
    return (
      <div className="relathandleRemountive h-full">
        <Unmounted handleRemount={handleRemount} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relathandleRemountive h-full">
        <div className="p-6 text-center bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-600">Loading Phone Interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relathandleRemountive h-full">
      {/* Original Browser-Phone iframe */}
      {!loading && (
        <div className="browser-phone-container"
          style={{ maxWidth: '100%', height: '100%', margin: '0 auto' }}
        >
          <iframe
            ref={iframeRef}
            src="/Browser-Phone-master/Phone/index.html"
            // src="/browser-phone-custom.html"
            style={{ width: '100%', height: '100%', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            title="Browser Phone"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            allow="microphone; camera; autoplay; display-capture"
            loading="lazy"
            onLoad={handleIframeLoad}
          />

          {/* Apply modern styles to the iframe content */}
          <BrowserPhoneStyles iframeRef={iframeRef} setError={setError} setLoading={setLoading} />
        </div>
      )}

      {/* Configuration source indicator */}
      {/* <div className="text-xs text-gray-500 text-center mt-2">
        {error ? 'Using fallback configuration' : 'Using database configuration'}
      </div> */}
    </div>
  );
}