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
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 py-8">
      {/* Main Content Card */}
      <motion.div 
        className="w-full max-w-[520px] bg-card border border-border/50 rounded-3xl p-12"
        initial="hidden" 
        animate="visible" 
        variants={staggerContainer}
      >
        {/* Title */}
        <motion.div variants={fadeIn} className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-[#9ca3af] text-base">
            {isSignUp ? "Sign up to get started" : 'Sign in to your account'}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form 
          variants={fadeIn} 
          onSubmit={handleSubmit} 
          className="space-y-5"
        >
          {/* Username field - only for signup */}
          {isSignUp && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-sm font-medium text-white mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="h-12 pl-12 pr-4 bg-[#4a4a4a] border-transparent text-white placeholder:text-muted-foreground rounded-lg focus-visible:ring-0 focus-visible:border-transparent"
                  required={isSignUp}
                />
              </div>
            </motion.div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 pl-12 pr-4 bg-[#4a4a4a] border-transparent text-white placeholder:text-muted-foreground rounded-lg focus-visible:ring-0 focus-visible:border-transparent"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 pl-12 pr-12 bg-[#4a4a4a] border-transparent text-white placeholder:text-muted-foreground rounded-lg focus-visible:ring-0 focus-visible:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements - only for signup */}
          {isSignUp && password.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-[#4a4a4a] border border-border rounded-lg space-y-2"
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
                    style={{ color: req.met ? '#4ade80' : 'hsl(var(--muted-foreground))' }}
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
                  <Button variant="link" type="button" className="h-auto p-0 text-sm text-white hover:text-white/80 transition-colors">
                    Forgot password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-white">Reset Password</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Mail className="h-5 w-5" />
                      </div>
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        className="h-12 pl-12 pr-4 bg-[#4a4a4a] border-transparent text-white placeholder:text-muted-foreground rounded-lg focus-visible:ring-0 focus-visible:border-transparent"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-lg font-semibold bg-white hover:bg-white/90 text-black"
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
            className="w-full h-12 rounded-lg font-semibold text-base bg-white hover:bg-white/90 text-black mt-6"
            disabled={isLoading || (isSignUp && !allRequirementsMet)}
          >
            {isLoading 
              ? (isSignUp ? 'Creating account...' : 'Signing in...') 
              : (isSignUp ? 'Sign Up' : 'Sign In')
            }
          </Button>
        </motion.form>

        {/* Switch Auth Mode */}
        <motion.div variants={fadeIn} className="mt-6 text-center">
          <p className="text-muted-foreground">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword('');
              }}
              className="text-white font-medium hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </motion.div>
      </motion.div>

      {/* Footer - Outside Card */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground mt-8"
      >
        By continuing, you agree to our{' '}
        <a href="/terms" className="text-white hover:underline">
          Terms and Services
        </a>
      </motion.p>
    </div>
  );
}
