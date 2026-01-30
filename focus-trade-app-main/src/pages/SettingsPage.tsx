import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { usePreferences } from '@/hooks/usePreferences';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { ChevronRight, User, Palette, LogOut, Camera, KeyRound, CreditCard, ShieldAlert, Trash2, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const { settings, setUsername, refetch } = useSettings();
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarRemoveConfirm, setShowAvatarRemoveConfirm] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refetch();
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !settings.avatarUrl) return;

    setUploading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refetch();
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveUsername = async () => {
    await setUsername(usernameInput);
    setIsEditingUsername(false);
    toast.success('Username updated');
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
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <div className="relative mb-4">
            <button
              onClick={() => {
                if (settings.avatarUrl) {
                  setShowAvatarRemoveConfirm(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={uploading}
              className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border overflow-hidden group"
            >
              {settings.avatarUrl ? (
                <img 
                  src={settings.avatarUrl} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-foreground/50" strokeWidth={1.5} />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {settings.avatarUrl ? (
                  <Trash2 className="h-6 w-6 text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
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

      {/* Avatar Remove Confirmation */}
      <AlertDialog open={showAvatarRemoveConfirm} onOpenChange={setShowAvatarRemoveConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to remove your profile picture or upload a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAvatarRemoveConfirm(false);
                fileInputRef.current?.click();
              }}
              className="rounded-xl"
            >
              Upload New
            </Button>
            <AlertDialogAction 
              onClick={() => {
                handleRemoveAvatar();
                setShowAvatarRemoveConfirm(false);
              }} 
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
