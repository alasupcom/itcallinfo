import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useSipStore } from '@/store/sipStore';

// Define types for messages
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface CallStatus {
  isConnected: boolean;
  isRinging: boolean;
  isOnCall: boolean;
  duration: number;
}

export default function VocalChatUI() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<CallStatus>({
    isConnected: false,
    isRinging: false,
    isOnCall: false,
    duration: 0
  });
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Hello! I'm your AI Assistant. Click the call button to start a conversation with me.", 
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  
  // Refs for audio visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const voiceDetectionIntervalRef = useRef<number | null>(null);
  const audioLevelHistoryRef = useRef<number[]>([]);
  const callDurationIntervalRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  const { sipConfig } = useSipStore();

  const addMessage = (text: string, sender: 'user' | 'ai') => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date()
    }]);
  };

  const startCallTimer = () => {
    callDurationIntervalRef.current = window.setInterval(() => {
      setCallStatus(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }
    setCallStatus(prev => ({ ...prev, duration: 0 }));
  };

  // Initialize browser-phone iframe
  useEffect(() => {
    if (!sipConfig) return;

    const iframe = document.createElement('iframe');
    iframe.src = '/Browser-Phone-master/Phone/index.html';
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.sandbox.add('allow-same-origin', 'allow-scripts', 'allow-forms', 'allow-popups', 'allow-modals');
    iframe.allow = 'microphone; camera; autoplay; display-capture';
    
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    // Handle iframe load
    iframe.onload = () => {
      console.log('Browser-Phone iframe loaded');
      
      // Send configuration to iframe
      const websocketProtocol = sipConfig.transport === 'wss' ? 'wss://' : 'ws://';
      const websocketUrl = `${websocketProtocol}${sipConfig.server}:${sipConfig.port}/ws`;

      // Set localStorage for Browser-Phone
      localStorage.setItem("wssServer", sipConfig.server);
      localStorage.setItem("WebSocketPort", String(sipConfig.port));
      localStorage.setItem("ServerPath", "/ws");
      localStorage.setItem("profileName", sipConfig.username);
      localStorage.setItem("SipDomain", sipConfig.domain);
      localStorage.setItem("SipUsername", sipConfig.username);
      localStorage.setItem("SipPassword", sipConfig.password);

      // Send configuration message
      setTimeout(() => {
        iframe.contentWindow?.postMessage({
          type: 'phoneConfig',
          config: {
            webSocketUrl: websocketUrl,
            serverAddress: sipConfig.server,
            webSocketPort: sipConfig.port,
            serverPath: "/ws",
            sipUsername: sipConfig.username,
            sipPassword: sipConfig.password,
            sipDomain: sipConfig.domain,
            regExpires: 0,
            transport: sipConfig.transport,
            doRegistration: false
          }
        }, '*');
      }, 1000);
    };

    return () => {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
  }, [sipConfig]);

  // Handle phone events
  useEffect(() => {
    const handlePhoneEvent = (event: CustomEvent) => {
      const { detail } = event;
      console.log('Phone event:', detail.event);

      switch (detail.event) {
        case 'sipRegisterConnected':
          console.log('SIP connected');
          break;
        case 'callStarted':
          setCallStatus(prev => ({ ...prev, isRinging: true }));
          addMessage('Calling AI Assistant...', 'ai');
          break;
        case 'callConnected':
          setCallStatus(prev => ({ 
            ...prev, 
            isRinging: false, 
            isOnCall: true,
            isConnected: true 
          }));
          addMessage('Connected to AI Assistant! You can now speak.', 'ai');
          startCallTimer();
          break;
        case 'callEnded':
          setCallStatus(prev => ({ 
            ...prev, 
            isRinging: false, 
            isOnCall: false,
            isConnected: false 
          }));
          addMessage('Call ended. Click the call button to start a new conversation.', 'ai');
          stopCallTimer();
          break;
      }
    };

    // Also listen for window message events from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'phoneEvent') {
        const { data } = event.data;
        console.log('Message event:', data.event);

        switch (data.event) {
          case 'sipRegisterConnected':
            console.log('SIP connected via message');
            break;
          case 'callStarted':
            setCallStatus(prev => ({ ...prev, isRinging: true }));
            addMessage('Calling AI Assistant...', 'ai');
            break;
          case 'callConnected':
            setCallStatus(prev => ({ 
              ...prev, 
              isRinging: false, 
              isOnCall: true,
              isConnected: true 
            }));
            addMessage('Connected to AI Assistant! You can now speak.', 'ai');
            startCallTimer();
            break;
          case 'callEnded':
            setCallStatus(prev => ({ 
              ...prev, 
              isRinging: false, 
              isOnCall: false,
              isConnected: false 
            }));
            addMessage('Call ended. Click the call button to start a new conversation.', 'ai');
            stopCallTimer();
            break;
        }
      }
    };

    window.addEventListener('browser-phone-event', handlePhoneEvent as EventListener);
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('browser-phone-event', handlePhoneEvent as EventListener);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Make call to AI Assistant (2222)
  const makeCall = () => {
    if (!iframeRef.current?.contentWindow) {
      console.error('Browser-Phone iframe not ready');
      return;
    }

    try {
      // Use the Browser-Phone's DialByLine function
      iframeRef.current.contentWindow.postMessage({
        type: 'phoneCommand',
        command: 'dial',
        data: { number: '2222' }
      }, '*');
      
      console.log('Initiating call to AI Assistant (2222)');
    } catch (error) {
      console.error('Error making call:', error);
      addMessage('Error making call. Please try again.', 'ai');
    }
  };

  // End call
  const endCall = () => {
    if (!iframeRef.current?.contentWindow) {
      console.error('Browser-Phone iframe not ready');
      return;
    }

    try {
      iframeRef.current.contentWindow.postMessage({
        type: 'phoneCommand',
        command: 'hangup'
      }, '*');
      
      console.log('Ending call');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  // Toggle microphone
  const toggleMic = async (): Promise<void> => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!iframeRef.current?.contentWindow) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    try {
      iframeRef.current.contentWindow.postMessage({
        type: 'phoneCommand',
        command: 'mute',
        data: { muted: newMutedState }
      }, '*');
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  // Voice activity detection
  const detectVoiceActivity = (): void => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    
    // Track history for better detection
    audioLevelHistoryRef.current.push(average);
    if (audioLevelHistoryRef.current.length > 10) {
      audioLevelHistoryRef.current.shift();
    }
    
    // Calculate recent average
    const recentAverage = audioLevelHistoryRef.current.reduce((a, b) => a + b, 0) / 
                          audioLevelHistoryRef.current.length;
    
    // Threshold for voice detection (adjust as needed)
    const voiceThreshold = 15;
    
    // Check if sound is above threshold, likely voice
    const newIsSpeaking = recentAverage > voiceThreshold;
    
    if (newIsSpeaking !== isSpeaking) {
      setIsSpeaking(newIsSpeaking);
    }
  };
  
  // Start listening and visualizing
  const startListening = async (): Promise<void> => {
    try {
      // Clear previous state
      if (micStreamRef.current) {
        stopListening();
      }
      
      // @ts-ignore - Handle the AudioContext type compatibility
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      console.log("Microphone access granted!");
      
      micStreamRef.current = stream;
      
      // Set up audio context for visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; 
      analyser.smoothingTimeConstant = 0.6;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      // Don't connect to destination to avoid feedback
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Reset audio level history
      audioLevelHistoryRef.current = [];
      
      // Start voice detection at regular intervals
      voiceDetectionIntervalRef.current = window.setInterval(detectVoiceActivity, 100);
      
      setIsListening(true);
      visualize();
      
      console.log("Audio visualization started");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access your microphone. Please check your permissions and try again.");
    }
  };
  
  // Stop listening and clean up
  const stopListening = (): void => {
    console.log("Stopping audio capture...");
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(err => console.error("Error closing audio context:", err));
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (voiceDetectionIntervalRef.current !== null) {
      clearInterval(voiceDetectionIntervalRef.current);
      voiceDetectionIntervalRef.current = null;
    }
    
    setIsListening(false);
    setIsSpeaking(false);
    
    // Clear the canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw static circle when not listening
        const radius = Math.max(5, Math.min(canvas.width, canvas.height) / 2 - 10);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
    
    console.log("Audio capture stopped");
  };
  
  // Visualize audio on canvas
  const visualize = (): void => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(5, Math.min(width, height) / 2 - 10);
    
    const draw = (): void => {
      if (!analyserRef.current) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      
      if (isSpeaking) {
        // Use time domain data for wave visualization when speaking
        const timeData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeData);
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw base circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw waveform as circle fluctuations when speaking
        ctx.beginPath();
        
        const step = Math.max(1, Math.floor(bufferLength / 120));
        
        for (let i = 0; i < bufferLength; i += step) {
          const value = timeData[i];
          // Normalize and amplify for better visibility
          const normalized = (value - 128) / 64; // Will range from -2 to 2 for typical voice
          
          // Amplify the effect for visibility
          const waveRadius = radius * (1 + normalized * 0.3);
          
          const sliceAngle = (2 * Math.PI * i) / bufferLength;
          const x = centerX + Math.cos(sliceAngle) * waveRadius;
          const y = centerY + Math.sin(sliceAngle) * waveRadius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#8183f4';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Get frequency data for the pulsing circle when not speaking
        const freqData = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(freqData);
        
        // Calculate average for subtle pulse effect when not speaking
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += freqData[i];
        }
        const average = sum / bufferLength;
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw slightly pulsing circle when listening but not speaking
        const pulseRadius = radius * (1 + average / 2000);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius * 0.9, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.fill();
      }
    };
    
    draw();
  };
  
  useEffect(() => {
    const initializeAudio = async (): Promise<void> => {
      try {
        await startListening();
      } catch (err) {
        console.error("Error initializing audio:", err);
      }
    };
    
    initializeAudio();
    
    return () => {
      stopListening();
      stopCallTimer();
    };
  }, []);
  
  useEffect(() => {
    const handleResize = (): void => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
          
          if (!isListening) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              const radius = Math.max(5, (Math.min(canvas.width, canvas.height) / 2) - 10);
              
              ctx.beginPath();
              ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
              ctx.strokeStyle = '#6366F1';
              ctx.lineWidth = 4;
              ctx.stroke();
            }
          }
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isListening]);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vocal AI Assistant</h1>
            <p className="text-gray-600">Talk to your AI assistant at extension 2222</p>
          </div>
          <div className="flex items-center space-x-4">
            {callStatus.isOnCall && (
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Call Active</span>
                <span className="text-sm">{formatDuration(callStatus.duration)}</span>
              </div>
            )}
            {callStatus.isRinging && (
              <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Ringing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="relative w-80 h-80 md:w-96 md:h-96">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
          
          {/* Call Controls */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              {/* Main Call Button */}
              <button 
                onClick={callStatus.isOnCall ? endCall : makeCall}
                disabled={!sipConfig}
                className={`rounded-full w-20 h-20 flex items-center justify-center 
                           ${callStatus.isOnCall 
                             ? 'bg-red-500 hover:bg-red-600' 
                             : 'bg-green-500 hover:bg-green-600'
                           } 
                           ${!sipConfig ? 'bg-gray-400 cursor-not-allowed' : ''}
                           text-white shadow-lg transition-all duration-300 transform hover:scale-105`}
                title={callStatus.isOnCall ? "End Call" : "Call AI Assistant"}
              >
                {callStatus.isOnCall ? <PhoneOff size={32} /> : <Phone size={32} />}
              </button>
              
              {/* Secondary Controls */}
              {callStatus.isOnCall && (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={toggleMic}
                    className={`rounded-full w-12 h-12 flex items-center justify-center 
                               ${isListening ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'} 
                               text-white shadow-lg transition-colors duration-300`}
                    title={isListening ? "Stop Listening" : "Start Listening"}
                  >
                    {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  
                  <button 
                    onClick={toggleMute}
                    className={`rounded-full w-12 h-12 flex items-center justify-center 
                               ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} 
                               text-white shadow-lg transition-colors duration-300`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Status Indicator */}
          {isListening && (
            <div className={`absolute bottom-0 left-0 right-0 mx-auto w-32 text-center py-2 px-3 rounded-full text-sm font-medium transition-colors duration-300 ${
              isSpeaking ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {isSpeaking ? 'Speaking' : 'Listening'}
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-shrink-0 bg-white shadow-lg rounded-t-xl w-full max-w-4xl mx-auto">
        <div className="h-64 md:h-80 overflow-y-auto p-4 space-y-3">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`max-w-xs md:max-w-md rounded-lg py-2 px-3 ${
                  message.sender === 'ai' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-indigo-600 text-white'
                }`}
              >
                <div className="text-sm">{message.text}</div>
                <div className={`text-xs mt-1 ${message.sender === 'ai' ? 'text-gray-500' : 'text-indigo-200'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}