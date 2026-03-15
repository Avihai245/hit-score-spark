import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User, CreditCard, Bell, Key, Trash2, Copy, RefreshCw, Lock, Check } from 'lucide-react';
import { useEffect } from 'react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { id: 'billing', label: 'Plan & Billing', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'api', label: 'API Access', icon: <Key className="h-4 w-4" /> },
  { id: 'danger', label: 'Danger Zone', icon: <Trash2 className="h-4 w-4 text-red-400" /> },
];

const PLANS: { id: Plan; name: string; price: string; features: string[] }[] = [
  { id: 'free', name: 'Free', price: '$0', features: ['1 analysis/month', 'No remixes', 'Basic results'] },
  { id: 'payg', name: 'Pay As You Go', price: 'Credits', features: ['Pay per use', 'All features', 'No monthly limit'] },
  { id: 'pro', name: 'Pro', price: '$19/mo', features: ['Unlimited analyses', '10 remixes/month', 'Priority processing', 'Advanced insights'] },
  { id: 'studio', name: 'Studio', price: '$49/mo', features: ['Everything in Pro', 'Unlimited remixes', 'API access', 'White-label exports', 'Priority support'] },
];

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    analysisComplete: true,
    weeklyTips: false,
    productUpdates: true,
  });
  const [apiKey, setApiKey] = useState<string>(profile?.api_key ? '••••••••••••••••' : 'No API key generated');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  if (!user) return null;

  const plan: Plan = profile?.plan || 'free';
  const initials = (profile?.display_name || user.email || 'U').slice(0, 2).toUpperCase();

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from('viralize_users').update({ display_name: displayName }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    await signOut();
    navigate('/');
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(profile?.api_key || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20 pb-16">
      <div className="container max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold font-heading mb-8">Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <nav className="space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 min-h-[500px]">

            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Profile</h2>
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#F59E0B] flex items-center justify-center text-xl font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="font-medium">{profile?.display_name || 'Your Name'}</p>
                    <p className="text-sm text-white/40">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-white/60">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="bg-white/5 border-white/10 text-white rounded-xl max-w-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-white/60">Email</Label>
                  <Input
                    value={user.email || ''}
                    readOnly
                    className="bg-white/5 border-white/10 text-white/50 rounded-xl max-w-sm cursor-not-allowed"
                  />
                </div>
                <Button
                  onClick={saveProfile}
                  disabled={saving}
                  className="rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-0 gap-2"
                >
                  {saved ? <><Check className="h-4 w-4" /> Saved!</> : saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}

            {/* Plan & Billing */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Plan & Billing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PLANS.map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-2xl border p-5 transition-all ${
                        plan === p.id
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">{p.name}</span>
                        {plan === p.id && (
                          <Badge className="bg-[#8B5CF6]/20 text-[#8B5CF6] border-0 text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold font-heading mb-3">{p.price}</p>
                      <ul className="space-y-1 mb-4">
                        {p.features.map((f) => (
                          <li key={f} className="text-xs text-white/50 flex items-center gap-2">
                            <Check className="h-3 w-3 text-[#8B5CF6] shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                      {plan !== p.id && (
                        <div className="relative">
                          <Button
                            disabled
                            size="sm"
                            className="w-full rounded-xl bg-white/10 text-white/40 cursor-not-allowed border-0 text-xs"
                          >
                            {plan === 'free' || PLANS.findIndex(x => x.id === plan) < PLANS.findIndex(x => x.id === p.id) ? 'Upgrade' : 'Downgrade'}
                          </Button>
                          <Badge className="absolute -top-2 -right-2 bg-[#F59E0B]/90 text-black border-0 text-[10px] px-2">
                            Coming Soon
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-sm text-white/50">
                  <p className="font-medium text-white/70 mb-1">Usage this month</p>
                  <p>Analyses: {profile?.analyses_used || 0} / {PLAN_LIMITS[plan].analyses === 999 ? '∞' : PLAN_LIMITS[plan].analyses}</p>
                  <p>Remixes: {profile?.remixes_used || 0} / {PLAN_LIMITS[plan].remixes === 999 ? '∞' : PLAN_LIMITS[plan].remixes === 0 ? 'Not included' : PLAN_LIMITS[plan].remixes}</p>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { key: 'analysisComplete' as const, label: 'Email when analysis complete', desc: 'Get notified when your song analysis is ready' },
                    { key: 'weeklyTips' as const, label: 'Weekly tips', desc: 'Music production tips and trends every week' },
                    { key: 'productUpdates' as const, label: 'Product updates', desc: 'New features, improvements, and announcements' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key]}
                        onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
                        className="data-[state=checked]:bg-[#8B5CF6]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Access */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">API Access</h2>
                {plan !== 'studio' ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Lock className="h-7 w-7 text-white/20" />
                    </div>
                    <p className="font-medium text-white/60">API Access is Studio only</p>
                    <p className="text-sm text-white/30 mt-1 mb-4">Upgrade to Studio to unlock API access</p>
                    <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#F59E0B] text-white border-0">
                      <Link to="/settings?tab=billing">Upgrade to Studio</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-white/60">Your API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          value={apiKey}
                          readOnly
                          className="bg-white/5 border-white/10 text-white font-mono text-sm rounded-xl"
                        />
                        <Button onClick={copyApiKey} size="sm" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl px-3">
                          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl px-3 gap-1">
                          <RefreshCw className="h-4 w-4" /> Regenerate
                        </Button>
                      </div>
                    </div>
                    <div className="bg-[#111] rounded-xl p-4 font-mono text-xs text-white/70 overflow-x-auto">
                      <pre>{`# Example usage
curl -X POST https://api.viralize.app/v1/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"audio_url": "https://example.com/song.mp3"}'`}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Danger Zone</h2>
                <div className="border border-red-500/20 rounded-2xl p-6 bg-red-500/5">
                  <h3 className="font-semibold text-red-400 mb-2">Delete Account</h3>
                  <p className="text-sm text-white/50 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="rounded-xl bg-red-600 hover:bg-red-700 border-0">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111] border border-white/10 text-white rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/50">
                          This will permanently delete your account, all analyses, remixes, and data. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-xl border-0"
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
