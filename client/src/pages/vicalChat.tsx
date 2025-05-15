import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

// Define types for messages
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export default function VocalChatUI() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you today?", sender: "ai" },
    { id: 2, text: "I need some information about your services.", sender: "user" },
    { id: 3, text: "Sure, I'd be happy to tell you about our offerings.", sender: "ai" }
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  
  // Refs for audio visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const voiceDetectionIntervalRef = useRef<number | null>(null);
  const audioLevelHistoryRef = useRef<number[]>([]);
  
  // Toggle microphone
  const toggleMic = async (): Promise<void> => {
    if (isListening) {
        startListening();
    } else {
        stopListening();
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInputValue(e.target.value);
  };
  
  const handleSendMessage = (): void => {
    if (inputValue.trim()) {
      setMessages([...messages, { id: Date.now(), text: inputValue, sender: "user" }]);
      setInputValue("");
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
          <button 
            onClick={toggleMic}
            className={`absolute inset-0 m-auto rounded-full w-16 h-16 flex items-center justify-center 
                       ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} 
                       text-white shadow-lg transition-colors duration-300`}
            title={isListening ? "Stop Listening" : "Start Listening"}
          >
            {isListening ?  <Mic size={24} /> : <MicOff size={24} />}
          </button>
          
          {isListening && (
            <div className={`absolute bottom-0 left-0 right-0 mx-auto w-24 text-center py-1 px-2 rounded-full text-xs font-medium transition-colors duration-300 ${
              isSpeaking ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {isSpeaking ? 'Speaking' : 'Listening'}
            </div>
          )}
        </div>
      </div>
      
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
                    ? 'bg-gray-200 text-gray-800' 
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-grow resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-20"
              rows={1}
            />
            <button 
              onClick={handleSendMessage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-300"
              title="Send Message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}