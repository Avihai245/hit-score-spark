import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { User, Check, Camera } from 'lucide-react';

export default function Profile() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const plan: Plan = (profile?.plan as Plan) || 'free';
  const initials = (profile?.display_name || user?.email || 'U').slice(0, 2).toUpperCase();

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('viralize_users').update({ display_name: displayName } as any).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal information</p>
        </div>

        {/* Avatar + basic info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-primary-foreground">
                {initials}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{profile?.display_name || 'Your Name'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge className="bg-primary/10 text-primary border-0 text-[10px] uppercase mt-1">{PLAN_LIMITS[plan].label}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1 bg-muted/30 border-border rounded-lg"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={user?.email || ''} readOnly className="mt-1 bg-muted/30 border-border rounded-lg text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Member Since</Label>
              <Input value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'} readOnly className="mt-1 bg-muted/30 border-border rounded-lg text-muted-foreground cursor-not-allowed" />
            </div>
          </div>

          <Button onClick={saveProfile} disabled={saving} className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg gap-2">
            {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Account stats */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Account Summary</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Analyses</p>
              <p className="text-lg font-bold text-foreground">{profile?.analyses_used || 0}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Credits</p>
              <p className="text-lg font-bold text-foreground">{profile?.credits || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
