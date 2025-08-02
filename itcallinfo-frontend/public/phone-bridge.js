/**
 * Phone Bridge - Handles communication between React app and Browser-Phone iframe
 * This script acts as a bridge to enable calling functionality from the React UI
 */

(function() {
  'use strict';

  // Store references to Browser-Phone functions
  let phoneFunctions = {};
  let isPhoneReady = false;

  // Listen for messages from parent (React app)
  window.addEventListener('message', function(event) {
    // Only accept messages from the same origin
    if (event.origin !== window.location.origin) {
      return;
    }

    const { type, command, data } = event.data;

    if (type === 'phoneConfig') {
      console.log('Phone Bridge: Received configuration', data);
      applyPhoneConfiguration(data);
    } else if (type === 'phoneCommand') {
      console.log('Phone Bridge: Received command', command, data);
      executePhoneCommand(command, data);
    }
  });

  // Apply phone configuration
  function applyPhoneConfiguration(config) {
    try {
      // Set localStorage values for Browser-Phone
      localStorage.setItem("wssServer", config.serverAddress);
      localStorage.setItem("WebSocketPort", String(config.webSocketPort));
      localStorage.setItem("ServerPath", config.serverPath);
      localStorage.setItem("profileName", config.sipUsername);
      localStorage.setItem("SipDomain", config.sipDomain);
      localStorage.setItem("SipUsername", config.sipUsername);
      localStorage.setItem("SipPassword", config.sipPassword);

      console.log('Phone Bridge: Configuration applied');
      
      // Notify parent that configuration is ready
      window.parent.postMessage({
        type: 'phoneEvent',
        data: {
          event: 'configApplied'
        }
      }, '*');
    } catch (error) {
      console.error('Phone Bridge: Error applying configuration', error);
    }
  }

  // Execute phone commands
  function executePhoneCommand(command, data) {
    try {
      switch (command) {
        case 'dial':
          if (data && data.number) {
            console.log('Phone Bridge: Dialing number', data.number);
            
            // Use Browser-Phone's DialByLine function if available
            if (typeof window.DialByLine === 'function') {
              window.DialByLine('audio', null, data.number);
              
              // Notify parent that call is starting
              window.parent.postMessage({
                type: 'phoneEvent',
                data: {
                  event: 'callStarted',
                  number: data.number
                }
              }, '*');
            } else {
              console.warn('Phone Bridge: DialByLine function not available');
            }
          }
          break;
          
        case 'hangup':
          console.log('Phone Bridge: Hanging up call');
          
          // Use Browser-Phone's hangup function if available
          if (typeof window.Hangup === 'function') {
            window.Hangup();
            
            // Notify parent that call ended
            window.parent.postMessage({
              type: 'phoneEvent',
              data: {
                event: 'callEnded'
              }
            }, '*');
          } else {
            console.warn('Phone Bridge: Hangup function not available');
          }
          break;
          
        case 'mute':
          if (data && typeof data.muted !== 'undefined') {
            console.log('Phone Bridge: Toggling mute', data.muted);
            
            // Use Browser-Phone's mute function if available
            if (typeof window.MuteAudio === 'function') {
              window.MuteAudio(data.muted);
            } else {
              console.warn('Phone Bridge: MuteAudio function not available');
            }
          }
          break;
          
        case 'dtmf':
          if (data && data.key) {
            console.log('Phone Bridge: Sending DTMF', data.key);
            
            // Use Browser-Phone's DTMF function if available
            if (typeof window.SendDTMF === 'function') {
              window.SendDTMF(data.key);
            } else {
              console.warn('Phone Bridge: SendDTMF function not available');
            }
          }
          break;
          
        default:
          console.warn('Phone Bridge: Unknown command', command);
      }
    } catch (error) {
      console.error('Phone Bridge: Error executing command', command, error);
    }
  }

  // Hook into Browser-Phone events
  function setupPhoneHooks() {
    // Override or hook into Browser-Phone's event system
    if (typeof window.web_hook_on_register === 'undefined') {
      window.web_hook_on_register = function(ua) {
        console.log('Phone Bridge: SIP registered');
        isPhoneReady = true;
        
        window.parent.postMessage({
          type: 'phoneEvent',
          data: {
            event: 'sipRegisterConnected'
          }
        }, '*');
      };
    }

    if (typeof window.web_hook_on_registrationFailed === 'undefined') {
      window.web_hook_on_registrationFailed = function(e) {
        console.log('Phone Bridge: SIP registration failed', e);
        
        window.parent.postMessage({
          type: 'phoneEvent',
          data: {
            event: 'sipRegisterFailed',
            error: e
          }
        }, '*');
      };
    }

    if (typeof window.web_hook_on_invite === 'undefined') {
      window.web_hook_on_invite = function(session) {
        console.log('Phone Bridge: Incoming call', session);
        
        window.parent.postMessage({
          type: 'phoneEvent',
          data: {
            event: 'incomingCall',
            session: session
          }
        }, '*');
      };
    }

    if (typeof window.web_hook_on_call_connected === 'undefined') {
      window.web_hook_on_call_connected = function(session) {
        console.log('Phone Bridge: Call connected', session);
        
        window.parent.postMessage({
          type: 'phoneEvent',
          data: {
            event: 'callConnected',
            session: session
          }
        }, '*');
      };
    }

    if (typeof window.web_hook_on_call_ended === 'undefined') {
      window.web_hook_on_call_ended = function(session) {
        console.log('Phone Bridge: Call ended', session);
        
        window.parent.postMessage({
          type: 'phoneEvent',
          data: {
            event: 'callEnded',
            session: session
          }
        }, '*');
      };
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPhoneHooks);
  } else {
    setupPhoneHooks();
  }

  // Also try to setup hooks after a delay to ensure Browser-Phone is loaded
  setTimeout(setupPhoneHooks, 1000);
  setTimeout(setupPhoneHooks, 3000);

  console.log('Phone Bridge: Initialized');
})();