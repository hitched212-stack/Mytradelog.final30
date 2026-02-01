import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { settings, setUsername } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [username, setUsernameLocal] = useState(settings.username || '');

  useEffect(() => {
    setUsernameLocal(settings.username || '');
  }, [settings.username]);

  const handleSave = async () => {
    const saved = await setUsername(username.trim());
    if (saved) {
      toast({
        title: 'Profile updated',
        description: username.trim() ? `Username set to ${username.trim()}` : 'Username cleared'
      });
      navigate('/settings');
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">Your personal details</p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8">
        <div className="rounded-2xl bg-card border border-border/50 p-6 space-y-6 shadow-sm">
          {/* Avatar section */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border border-border/50">
              <User className="h-8 w-8 text-foreground/70" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Authenticated</p>
            </div>
          </div>

          {/* Username */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Username
            </Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsernameLocal(e.target.value)}
              className="h-12 bg-muted/50 border-border/50"
              placeholder="Enter your username"
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground mt-2">
              This is how you'll appear in the app
            </p>
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}