import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { z } from 'zod';
import { Check, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

// Custom slash logo icon matching dashboard/landing
const SlashLogoIcon = ({
  className
}: {
  className?: string;
}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="15" y1="5" x2="9" y2="19" />
  </svg>
);

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

interface PasswordRequirement {
  label: string;
  met: boolean;
}

const fadeIn = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const
    }
  }
};

const staggerContainer = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

export default function Auth() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const {
    signIn,
    signUp,
    resetPassword,
    user
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check URL params for tab selection
  const forceLogin = searchParams.get('login') === 'true';
  const tabParam = searchParams.get('tab');
  
  useEffect(() => {
    if (tabParam === 'signup') {
      setIsSignUp(true);
    }
  }, [tabParam]);

  useEffect(() => {
    // Only auto-redirect if user is logged in AND not forcing login
    if (user && !forceLogin && !tabParam) {
      navigate('/dashboard');
    }
  }, [user, navigate, forceLogin, tabParam]);

  const passwordRequirements: PasswordRequirement[] = useMemo(() => [{
    label: 'At least 6 characters',
    met: password.length >= 6
  }, {
    label: 'Contains a number',
    met: /\d/.test(password)
  }, {
    label: 'Contains a letter',
    met: /[a-zA-Z]/.test(password)
  }], [password]);

  const allRequirementsMet = passwordRequirements.every(req => req.met);

  const validateInput = () => {
    try {
      authSchema.parse({
        email,
        password
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput()) return;
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
      navigate('/dashboard?returning=true');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput()) return;
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(email, password, username.trim());
    setIsLoading(false);
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message);
      }
    } else {
      // Update the username in the profiles table
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from('profiles')
          .update({ username: username.trim() })
          .eq('user_id', userData.user.id);
      }
      toast.success('Account created successfully!');
      navigate('/paywall');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    try {
      z.string().email().parse(resetEmail);
    } catch {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsResetLoading(true);
    const { error } = await resetPassword(resetEmail);
    setIsResetLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent! Check your inbox.');
      setResetDialogOpen(false);
      setResetEmail('');
    }
  };

  const handleSubmit = isSignUp ? handleSignUp : handleSignIn;

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Remove gradient to prevent white flash */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 relative z-10">
        <motion.div 
          className="w-full max-w-md mx-auto"
          initial="hidden" 
          animate="visible" 
          variants={staggerContainer}
        >
          {/* Logo */}
          <motion.div variants={fadeIn} className="flex justify-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center">
              <SlashLogoIcon className="h-8 w-8 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div variants={fadeIn} className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </h1>
            <p className="text-neutral-400 text-base">
              {isSignUp ? "Let's create your account" : 'Welcome back to MyTradeLog'}
            </p>
          </motion.div>

          {/* Form */}
          <motion.form 
            variants={fadeIn} 
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            {/* Username field - only for signup */}
            {isSignUp && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="h-14 pl-12 pr-4 rounded-2xl placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-700 focus-visible:border-neutral-700"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
                  required={isSignUp}
                />
              </motion.div>
            )}

            {/* Email field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-14 pl-12 pr-4 rounded-2xl placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-700 focus-visible:border-neutral-700"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
                required
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-14 pl-12 pr-12 rounded-2xl placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-700 focus-visible:border-neutral-700"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password Requirements - only for signup */}
            {isSignUp && password.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl space-y-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                      req.met ? "bg-green-500" : "bg-neutral-600"
                    )}>
                      {req.met && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span 
                      className="text-sm transition-colors"
                      style={{ color: req.met ? '#4ade80' : 'rgba(255,255,255,0.5)' }}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Forgot Password - only for signin */}
            {!isSignUp && (
              <div className="text-right">
              <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" type="button" className="h-auto p-0 text-sm text-neutral-400 hover:text-white transition-colors">
                      Forgot password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl bg-neutral-900 border-neutral-800">
                    <DialogHeader>
                      <DialogTitle className="text-xl text-white">Reset Password</DialogTitle>
                      <DialogDescription className="text-neutral-400">
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                          <Mail className="h-5 w-5" />
                        </div>
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={resetEmail}
                          onChange={e => setResetEmail(e.target.value)}
                          className="h-14 pl-12 pr-4 rounded-2xl placeholder:text-neutral-500"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.1)' }}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-14 rounded-2xl font-semibold bg-white hover:bg-neutral-200"
                        style={{ color: '#000000' }}
                        disabled={isResetLoading}
                      >
                        {isResetLoading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl font-semibold text-base bg-white hover:bg-neutral-200 transition-all mt-6"
              style={{ color: '#000000' }}
              disabled={isLoading || (isSignUp && !allRequirementsMet)}
            >
              {isLoading 
                ? (isSignUp ? 'Creating account...' : 'Signing in...') 
                : (isSignUp ? 'Sign Up' : 'Sign In')
              }
            </Button>
          </motion.form>

          {/* Switch Auth Mode */}
          <motion.div variants={fadeIn} className="mt-8 text-center">
            <p className="text-neutral-400">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                }}
                className="text-white font-medium hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.p variants={fadeIn} className="text-center text-xs text-neutral-500 mt-8">
            Bi continuing, you agree to our{' '}
            <a href="/terms" className="text-neutral-400 underline hover:text-white transition-colors">
              Terms and Services
            </a>
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
