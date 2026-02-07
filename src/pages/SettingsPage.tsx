import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { usePreferences } from '@/hooks/usePreferences';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronRight, User, Palette, LogOut, KeyRound, CreditCard, ShieldAlert, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SettingsItemProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function SettingsItem({ icon: Icon, title, subtitle, onClick, variant = 'default' }: SettingsItemProps) {
  const isDanger = variant === 'danger';
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-transparent transition-colors text-left border-b border-border/50 last:border-b-0 group [-webkit-tap-highlight-color:transparent]"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
        isDanger ? 'bg-destructive/10' : 'bg-muted'
      }`}>
        <Icon className={`h-5 w-5 ${isDanger ? 'text-destructive' : 'text-foreground/70'}`} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-base ${isDanger ? 'text-destructive' : 'text-foreground'}`}>{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
    </button>
  );
}

function SettingsSection({ title, children, isGlassEnabled, patternId }: { title: string; children: React.ReactNode; isGlassEnabled?: boolean; patternId: string }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
        {title}
      </h2>
      <div className={cn(
        "rounded-2xl border overflow-hidden shadow-sm relative",
        isGlassEnabled
          ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
          : "border-border/50 bg-card"
      )}>
        {isGlassEnabled && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={patternId} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.04] dark:fill-foreground/[0.03]" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        )}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { settings, setUsername } = useSettings();
  const { preferences, setTimeZone } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const [timeZoneInput, setTimeZoneInput] = useState(preferences.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const navigate = useNavigate();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(settings.username || '');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSaveUsername = async () => {
    const saved = await setUsername(usernameInput);
    if (saved) {
      setIsEditingUsername(false);
      toast.success('Username updated');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordReset(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter a new email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast.success('Confirmation email sent! Check your inbox to verify the new email.');
      setNewEmail('');
      setShowEmailChange(false);
    } catch (error) {
      console.error('Error changing email:', error);
      toast.error('Failed to change email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Profile Header */}
      <header className="px-4 pt-8 pb-6 md:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border overflow-hidden">
              <User className="h-12 w-12 text-foreground/50" strokeWidth={1.5} />
            </div>
          </div>
          
          {isEditingUsername ? (
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="h-9 w-40 text-center bg-muted border-border"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveUsername} className="h-9">
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingUsername(false)} className="h-9">
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => {
                setUsernameInput(settings.username || '');
                setIsEditingUsername(true);
              }}
              className="text-2xl font-bold text-foreground hover:text-foreground/80 transition-colors mb-1"
            >
              {settings.username || 'Tap to set name'}
            </button>
          )}
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      {/* Settings Content */}
      <div className="px-4 md:px-6 lg:px-8 space-y-6">
        {/* Time Zone Section */}
        <SettingsSection title="Time Zone" isGlassEnabled={isGlassEnabled} patternId="settings-timezone-dots">
          <div className="p-4 flex flex-col gap-3">
            <Label htmlFor="timezone-select" className="text-base font-semibold text-foreground mb-1">Time Zone</Label>
            <div className="relative">
              <select
                id="timezone-select"
                value={timeZoneInput}
                onChange={e => setTimeZoneInput(e.target.value)}
                className="w-full h-12 px-4 py-2 rounded-xl bg-white border border-gray-300 shadow-md text-lg font-semibold text-black dark:bg-neutral-900 dark:text-white dark:border-border focus:outline-none appearance-none transition-all font-montserrat"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}
              >
                {/* Main trading time zones */}
                <option value="America/New_York" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>EST (New York)</option>
                <option value="America/Chicago" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>CST (Chicago)</option>
                <option value="America/Denver" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>MST (Denver)</option>
                <option value="America/Los_Angeles" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>PST (Los Angeles)</option>
                <option value="Europe/London" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>GMT (London)</option>
                <option value="Europe/Frankfurt" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>CET (Frankfurt)</option>
                <option value="Asia/Tokyo" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>JST (Tokyo)</option>
                <option value="Asia/Hong_Kong" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>HKT (Hong Kong)</option>
                <option value="Australia/Sydney" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>AEST (Sydney)</option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-montserrat" style={{ fontFamily: 'Montserrat, Inter, Roboto, Arial, sans-serif' }}>
                ▼
              </span>
            </div>
            <Button
              onClick={() => { setTimeZone(timeZoneInput); toast.success('Time zone updated!'); }}
              className="w-full mt-2 text-base h-11 rounded-xl"
              disabled={preferences.timeZone === timeZoneInput}
            >
              Save Time Zone
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Your economic calendar will show news events in this time zone.</p>
          </div>
        </SettingsSection>
        {/* Account Section */}
        <SettingsSection title="Account" isGlassEnabled={isGlassEnabled} patternId="settings-account-dots">
          <Collapsible open={showPasswordReset} onOpenChange={setShowPasswordReset}>
            <CollapsibleTrigger className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left group border-b border-border/50">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${showPasswordReset ? 'rotate-90' : ''}`} strokeWidth={1.5} />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-b border-border/50">
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="newPassword" className="text-sm text-muted-foreground">New Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-muted/50 border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">Confirm Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-muted/50 border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isResettingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible open={showEmailChange} onOpenChange={setShowEmailChange}>
            <CollapsibleTrigger className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left group border-b border-border/50">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Mail className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base text-foreground">Change Email</p>
                <p className="text-sm text-muted-foreground">Update your email address</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${showEmailChange ? 'rotate-90' : ''}`} strokeWidth={1.5} />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-b border-border/50">
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Current Email</Label>
                  <p className="text-sm text-foreground mt-1">{user?.email}</p>
                </div>
                <div>
                  <Label htmlFor="newEmail" className="text-sm text-muted-foreground">New Email</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  A confirmation email will be sent to both your current and new email addresses.
                </p>
                <Button
                  onClick={handleChangeEmail}
                  disabled={isChangingEmail || !newEmail}
                  className="w-full"
                >
                  {isChangingEmail ? 'Sending...' : 'Change Email'}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <SettingsItem
            icon={CreditCard}
            title="Billing & Subscription"
            subtitle="Manage your plan and payment method"
            onClick={() => navigate('/settings/billing')}
          />
          <SettingsItem
            icon={Palette}
            title="Appearance"
            subtitle="Theme, accent color & effects"
            onClick={() => navigate('/settings/preferences')}
          />
          <SettingsItem
            icon={ShieldAlert}
            title="Account Security"
            subtitle="Erase data or delete account"
            onClick={() => navigate('/settings/security')}
            variant="danger"
          />
        </SettingsSection>

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full h-12 mt-4 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

    </div>
  );
}
