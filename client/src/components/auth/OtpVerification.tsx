import { useState, useRef, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { useVerifyOtp } from "@/hooks/api/useAuth";

interface OtpVerificationProps {
  userId: number;
  generatedOtp?: string | null; // TODO:For test sake, in production this come from email/SMS
  onVerificationSuccess: () => void;
}

export default function OtpVerification({ userId, generatedOtp, onVerificationSuccess }: OtpVerificationProps) {
  const { isLoading: isUserLoading } = useUserStore();
  const { toast } = useToast();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  

  const { mutateAsync: doOtpVerification, isPending: isOtpVerificationLoading } = useVerifyOtp({
    onSuccess: () => {
      toast({
        title: "Verification successful",
        description: "Your account has been verified successfully",
      });
      onVerificationSuccess();
    },
    onError: () => {
      toast({
        title: "Verification failed",
        description: "The OTP code you entered is invalid or expired",
        variant: "destructive",
      });
    }
  });
  // Timer countdown
  useEffect(() => {
    if (remainingTime <= 0) return;
    
    const timer = setInterval(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingTime]);
  
  // Format remaining time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input on entry
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Navigate with arrow keys
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle backspace
    if (e.key === 'Backspace') {
      if (otp[index] === '') {
        // If current field is empty, focus previous
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Clear current field
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    
    setOtp(newOtp);
    
    // Focus last input or the one after the filled digits
    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };
  
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code",
        variant: "destructive",
      });
      return;
    }

    await doOtpVerification({userId, otp: otpString});
  };
  
  const handleResendOtp = () => {

    // TODO: Add resend OTP mutation
    setRemainingTime(300);
    toast({
      title: "OTP Resent",
      description: "A new OTP code has been sent to your email/phone",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Verify Your Account</CardTitle>
        <CardDescription className="text-center">
          Enter the 6-digit code sent to your email or phone
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generatedOtp && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Demo Mode:</strong> Use this OTP code: <span className="font-mono font-bold">{generatedOtp}</span>
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
              In production, this would be sent via email or SMS.
            </p>
          </div>
        )}
        
        <div className="flex justify-center space-x-2 my-8">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
                return;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              className="w-12 h-12 text-center text-xl font-bold"
              value={digit}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              autoComplete="one-time-code"
            />
          ))}
        </div>
        
        <div className="text-center text-sm mb-4">
          <span className={`${remainingTime <= 60 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Code expires in: {formatTime(remainingTime)}
          </span>
        </div>
        
        <Button 
          className="w-full" 
          onClick={handleVerifyOtp} 
          disabled={isUserLoading || otp.some(digit => digit === '')}
        >
          {isUserLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
              Verifying...
            </>
          ) : (
            "Verify Account"
          )}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Didn't receive the code?{" "}
          <Button 
            variant="link" 
            className="text-primary p-0" 
            onClick={handleResendOtp}
            disabled={remainingTime > 0 && remainingTime < 270} // Allow resend after 30 seconds
          >
            Resend OTP
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
