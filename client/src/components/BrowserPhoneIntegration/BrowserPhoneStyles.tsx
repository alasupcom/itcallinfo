import React, { useEffect } from 'react';

/**
 * This component adds modern styles to the Browser-Phone iframe
 * without modifying the original code
 * and adds micro-interactions to enhance user engagement
 */

interface BrowserPhoneStylesProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  setError?: React.Dispatch<React.SetStateAction<string | null>>;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function BrowserPhoneStyles({ iframeRef, setError, setLoading }: BrowserPhoneStylesProps) {
  useEffect(() => {
    // Function to apply styles when iframe is loaded
    const applyStyles = () => {
      if (!iframeRef.current || !iframeRef.current.contentWindow) return;

      try {
        const iframe = iframeRef.current;

        // Safe access to contentDocument
        const iframeDocument = iframe.contentDocument ||
          (iframe.contentWindow ? iframe.contentWindow.document : null);

        if (!iframeDocument) {
          console.error('Could not access iframe document');
          return;
        }

        // Inject the bridge script
        // const bridgeScript = document.createElement('script');
        // bridgeScript.src = '/phone-bridge.js';
        // iframeDocument.head.appendChild(bridgeScript);

        // Inject the micro-interactions script
        // const interactionsScript = document.createElement('script');
        // interactionsScript.src = '/phone-interactions.js';
        // iframeDocument.head.appendChild(interactionsScript);

        // Create a style element
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          /* Modern UI enhancement */
           body {
            //  background-color: #f9fafb;
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
           }
          
          /* Add modern container */
          #Phone {
            max-width: 100%;
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: none;
          }
          
          /* Hide welcome screens and settings */
          #welcome, #welcomeScreen, #settings, .welcome-screen-container, 
          #register-container, #WebRtcSettings, #AccSettings, 
          #AudioVideoSettings, #AppearanceSettings, #NotificationsSettings,
          #btn-configure-account, #AccountSettings, #divCdrReport, #LanguageItems,
          .configure-account-button, .settings-item, #security, #Configure_Extension_Html, .UiSideField div:first-child {
            display: none !important;
          }
          
          /* Modern buttons */
          // .dialButton, .hangupButton {
          //   background-color: #4f46e5 !important;
          //   border-radius: 0.375rem !important;
          //   color: white !important;
          //   font-weight: 500 !important;
          //   padding: 0.5rem 1rem !important;
          //   border: none !important;
          //   box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          //   transition: background-color 0.2s !important;
          // }
          
          .dialButton:hover, .hangupButton:hover {
            background-color: #4338ca !important;
          }
          
          .hangupButton {
            background-color: #ef4444 !important;
          }
          
          .hangupButton:hover {
            background-color: #dc2626 !important;
          }
          
          /* Style dialog text */
          // #dialText {
          //   font-size: 1.25rem !important;
          //   font-weight: 500 !important;
          //   padding: 0.75rem !important;
          //   margin-bottom: 0.5rem !important;
          //   text-align: center !important;
          //   letter-spacing: 0.05em !important;
          //   width: 100% !important;
          //   border: 1px solid #e5e7eb !important;
          //   border-radius: 0.375rem !important;
          // }
          
          /* Style dialpad */
          // .dialButtons button {
          //   border-radius: 0.375rem !important;
          //   font-weight: 500 !important;
          //   font-size: 1.25rem !important;
          //   transition: all 0.2s !important;
          // }
          
          // .dialButtons button:hover {
          //   background-color: #f3f4f6 !important;
          //   transform: translateY(-1px) !important;
          // }
          
          /* Style call controls */
          // .callControls {
          //   display: flex !important;
          //   justify-content: center !important;
          //   gap: 1rem !important;
          //   margin: 1rem 0 !important;
          // }
          
          /* Style tabs */
          // .tab {
          //   padding: 0.75rem 1.25rem !important;
          //   border-radius: 0.375rem 0.375rem 0 0 !important;
          // }
          
          // .tab-selected {
          //   background-color: #ffffff !important;
          //   color: #4f46e5 !important;
          //   font-weight: 500 !important;
          // }
          
          /* Add custom status indicators */
          // .status-indicator {
          //   position: fixed;
          //   top: 10px;
          //   right: 10px;
          //   padding: 8px 12px;
          //   border-radius: 6px;
          //   font-weight: 500;
          //   color: white;
          //   display: flex;
          //   align-items: center;
          //   z-index: 1000;
          //   box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          // }
          
          // .status-indicator::before {
          //   content: "";
          //   display: inline-block;
          //   width: 8px;
          //   height: 8px;
          //   border-radius: 50%;
          //   margin-right: 8px;
          // }
          
          .status-connected {
            background-color: #10b981;
          }
          
          .status-connected::before {
            background-color: white;
          }
          
          .status-error {
            background-color: #ef4444;
          }
          
          .status-warning {
            background-color: #f59e0b;
          }
          
          /* Remove loading spinner after 2 seconds */
          .loading {
            animation: fadeOut 0.5s 2s forwards;
            display: none
          }

           /* Input fields */
          // input, select, textarea {
          //   border-radius: 4px !important;
          //   border: 1px solid #e2e8f0 !important;
          //   transition: all 0.2s ease !important;
          // }
          
          // input:focus, select:focus, textarea:focus {
          //   border-color: #4299e1 !important;
          //   box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15) !important;
          //   outline: none !important;
          // }
          
          /* Buttons */
          // button {
          //   transition: all 0.2s ease !important;
          //   position: relative;
          //   overflow: hidden;
          // }
          
          /* Rounded corners */
          .tab {
            border-radius: 4px 4px 0 0 !important;
          }
          
          /* Cards and panels */
          .card, .panel, .UiSideField {
            border-radius: 4px !important;
            transition: all 0.2s ease !important;
          }
          
          @keyframes fadeOut {
            to {
              opacity: 0;
              visibility: hidden;
            }
          }
        `;

        // Add the style element to the iframe's document
        iframeDocument.head.appendChild(styleElement);

        console.log('Applied modern styles to Browser-Phone iframe');
      } catch (err) {
        console.error("Error injecting configuration:", err);
        setError?.("Error configuring Browser-Phone");
        setLoading?.(false);
      }
    };

    // Check if iframe is already loaded
    if (iframeRef.current?.contentWindow?.document?.readyState === 'complete') {
      applyStyles();
    }

    // Set up an event listener for when the iframe loads
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', applyStyles);

      // Clean up
      return () => {
        iframe.removeEventListener('load', applyStyles);
      };
    }
  }, [iframeRef]);

  // This component doesn't render anything
  return null;
}