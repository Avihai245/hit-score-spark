import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User, Bell, Key, Trash2, Shield, Lock, Check, Copy, RefreshCw } from 'lucide-react';
import { Plan } from '@/lib/supabase';

const TABS = [
  { id: 'general', label: 'General', icon: <User className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { id: 'api', label: 'API Access', icon: <Key className="h-4 w-4" /> },
  { id: 'danger', label: 'Danger Zone', icon: <Trash2 className="h-4 w-4 text-destructive" /> },
];

export default function DashboardSettings() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    analysisComplete: true,
    weeklyTips: false,
    productUpdates: true,
  });

  const plan: Plan = (profile?.plan as Plan) || 'free';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Tab nav */}
          <aside className="md:w-48 shrink-0">
            <nav className="space-y-0.5">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 bg-card border border-border rounded-xl p-5 min-h-[400px]">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">General Settings</h2>
                <div>
                  <Label className="text-xs text-muted-foreground">Language</Label>
                  <select className="mt-1 w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>Hebrew</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Timezone</Label>
                  <select className="mt-1 w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground">
                    <option>UTC</option>
                    <option>US/Eastern</option>
                    <option>US/Pacific</option>
                    <option>Europe/London</option>
                    <option>Asia/Jerusalem</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Notification Preferences</h2>
                {[
                  { key: 'analysisComplete' as const, label: 'Analysis complete', desc: 'Get notified when your analysis is ready' },
                  { key: 'weeklyTips' as const, label: 'Weekly tips', desc: 'Music production tips and trends' },
                  { key: 'productUpdates' as const, label: 'Product updates', desc: 'New features and announcements' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={v => setNotifications(prev => ({ ...prev, [item.key]: v }))}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Security</h2>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-foreground">Password</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Managed through your authentication provider</p>
                  <Button size="sm" variant="outline" className="mt-2 rounded-lg text-xs border-border">
                    Change Password
                  </Button>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-foreground">Active Sessions</p>
                  <p className="text-xs text-muted-foreground mt-0.5">1 active session — current device</p>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">API Access</h2>
                {plan !== 'studio' ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Lock className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">API access is Studio plan only</p>
                    <Button asChild size="sm" className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg text-xs">
                      <Link to="/dashboard/billing">Upgrade to Studio</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <Label className="text-xs text-muted-foreground">Your API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value="••••••••••••••••" readOnly className="bg-muted/30 border-border font-mono text-sm rounded-lg" />
                      <Button size="sm" variant="outline" className="border-border rounded-lg"><Copy className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Danger Zone</h2>
                <div className="border border-destructive/20 rounded-xl p-4 bg-destructive/5">
                  <h3 className="text-sm font-semibold text-destructive mb-1">Delete Account</h3>
                  <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all data.</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="rounded-lg text-xs gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-popover border-border rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete your account and all data.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={signOut} className="bg-destructive text-destructive-foreground rounded-lg">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
