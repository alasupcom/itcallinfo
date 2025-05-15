/**
 * This script acts as a bridge between the React UI and the Browser-Phone core functionality
 * It will run within the Browser-Phone iframe and handle commands sent from the React app
 */

// Set up bridge only once
if (!window.phoneBridgeInitialized) {
    window.phoneBridgeInitialized = true;
    
    // Request configuration from parent as soon as bridge is loaded
    window.parent.postMessage('requestConfig', '*');
    
    // Listen for messages from parent window
    window.addEventListener('message', function(event) {
      // Only process messages from parent
      if (event.source !== window.parent) return;
      
      const { type, command, data, config } = event.data || {};
      
      // Handle configuration message
      if (type === 'phoneConfig' && config) {
        console.log('Phone Bridge: Received configuration');
        
        // Apply configuration to Browser-Phone
        if (typeof window.InitializePhone === 'function') {
          try {
            // Call Browser-Phone configure function with received config
            window.InitializePhone(config);
            
            // Automatically register after configuration
            if (config.doRegistration && typeof window.Register === 'function') {
              setTimeout(function() {
                window.Register();
              }, 500);
            }
            
            // Notify parent that config was applied
            window.parent.postMessage({
              type: 'phoneEvent',
              data: {
                event: 'configApplied'
              }
            }, '*');
          } catch (err) {
            console.error('Failed to initialize phone with config:', err);
          }
        }
      }
      
      // Handle phone commands from React UI
      if (type === 'phoneCommand') {
        console.log('Phone Bridge: Received command', command, data);
        
        switch (command) {
          case 'dial':
            if (data && data.number) {
              // Use the Browser-Phone's Call function
              if (typeof window.Call === 'function') {
                window.Call(data.number);
                
                // Notify parent that call is in progress
                window.parent.postMessage({
                  type: 'phoneEvent',
                  data: {
                    event: 'callStarted',
                    number: data.number
                  }
                }, '*');
              }
            }
            break;
            
          case 'hangup':
            // Use the Browser-Phone's Hangup function
            if (typeof window.Hangup === 'function') {
              window.Hangup();
              
              // Notify parent that call ended
              window.parent.postMessage({
                type: 'phoneEvent',
                data: {
                  event: 'callEnded'
                }
              }, '*');
            }
            break;
            
          case 'dtmf':
            // Send DTMF tone during active call
            if (data && data.key && typeof window.SendDTMF === 'function') {
              window.SendDTMF(data.key);
            }
            break;
            
          case 'mute':
            // Toggle microphone mute
            if (data && typeof data.muted !== 'undefined' && typeof window.MuteAudio === 'function') {
              window.MuteAudio(data.muted);
            }
            break;
            
          case 'video':
            // Toggle video
            if (data && typeof data.enabled !== 'undefined' && typeof window.ShowVideo === 'function') {
              window.ShowVideo(data.enabled);
            }
            break;
            
          case 'volume':
            // Adjust speaker volume
            if (data && typeof data.level !== 'undefined' && typeof window.SetSpeakerVolume === 'function') {
              window.SetSpeakerVolume(data.level);
            }
            break;
            
          default:
            console.log('Phone Bridge: Unsupported command:', command);
        }
      }
    });
    
    // Hook into Browser-Phone events to forward to React UI
    const hookIntoPhoneEvents = function() {
      // Listen for call connected event
      if (window.$ && typeof window.$.fn.on === 'function') {
        // Call connected
        $(document).on('callAnswered', function(event, session) {
          window.parent.postMessage({
            type: 'phoneEvent',
            data: {
              event: 'callConnected',
              sessionId: session ? session.id : null
            }
          }, '*');
        });
        
        // Call ended
        $(document).on('callTerminated', function(event, session) {
          window.parent.postMessage({
            type: 'phoneEvent',
            data: {
              event: 'callEnded',
              sessionId: session ? session.id : null,
              duration: session && session.data ? session.data.callTimer : '00:00'
            }
          }, '*');
        });
        
        // Incoming call
        $(document).on('incomingCall', function(event, session) {
          window.parent.postMessage({
            type: 'phoneEvent',
            data: {
              event: 'incomingCall',
              caller: session && session.remoteIdentity ? session.remoteIdentity.uri.user : 'unknown',
              sessionId: session ? session.id : null
            }
          }, '*');
        });
      }
    };
    
    // Hook events when jQuery is ready
    if (window.$ && window.$.isFunction) {
      hookIntoPhoneEvents();
    } else {
      // Wait for jQuery to be available
      const checkJQuery = setInterval(function() {
        if (window.$ && window.$.isFunction) {
          clearInterval(checkJQuery);
          hookIntoPhoneEvents();
        }
      }, 100);
    }
    
    // Helper function to initialize phone with configuration
    window.InitializePhone = function(config) {
      console.log('Initializing phone with config:', config);
      
      // Access global variables from phone.js
      if (window.wssServer) {
        window.wssServer = config.webSocketUrl;
      }
      
      if (window.SipUsername) {
        window.SipUsername = config.sipUsername;
      }
      
      if (window.SipPassword) {
        window.SipPassword = config.sipPassword;
      }
      
      if (window.SipDomain) {
        window.SipDomain = config.sipDomain;
      }
      
      if (window.RegisterExpires) {
        window.RegisterExpires = config.regExpires;
      }
      
      if (window.TransportWSS) {
        window.TransportWSS = config.transport === 'wss';
      }
      
      // Notify that initialization is complete
      console.log('Phone configuration applied');
      
      // Send SIP registration status to parent
      window.parent.postMessage({
        type: 'phoneEvent',
        data: {
          event: 'sipRegisterAttempt',
          username: config.sipUsername,
          server: config.serverAddress
        }
      }, '*');
      
      return true;
    };
    
    // Expose a global function for parent to refresh registration
    window.RefreshRegister = function() {
      if (typeof window.Register === 'function') {
        window.Register();
        return true;
      }
      return false;
    };
    
    // Add event listeners for SIP registration status events
    if (window.$ && typeof window.$.fn.on === 'function') {
      // SIP registration connected
      $(document).on('regSuccessful', function() {
        window.parent.postMessage({
          type: 'phoneEvent',
          data: {
            event: 'sipRegisterConnected'
          }
        }, '*');
      });
      
      // SIP registration failed
      $(document).on('regFailed', function() {
        window.parent.postMessage({
          type: 'phoneEvent',
          data: {
            event: 'sipRegisterDisconnected',
            reason: 'Registration failed'
          }
        }, '*');
      });
      
      // SIP unregistered
      $(document).on('regEnded', function() {
        window.parent.postMessage({
          type: 'phoneEvent',
          data: {
            event: 'sipRegisterDisconnected',
            reason: 'Unregistered'
          }
        }, '*');
      });
    }
    
    console.log('Phone Bridge initialized');
  }