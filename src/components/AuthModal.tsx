import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setLoading(false);
  };

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) return setError(error.message);
    onClose();
    reset();
  };

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) return setError(error.message);
    setError(null);
    // Show success message
    onClose();
    reset();
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="bg-[#111111] border border-white/10 text-white max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-[#8B5CF6] to-[#F59E0B] bg-clip-text text-transparent">
            Welcome to Viralize
          </DialogTitle>
          <p className="text-center text-sm text-white/50 mt-1">Your music's potential, unlocked</p>
        </DialogHeader>

        <Tabs defaultValue="signin" className="px-8 pb-8 pt-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 rounded-xl mb-6">
            <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-white/60">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-white/60">
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Shared form fields */}
          {(['signin', 'signup'] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4 mt-0">
              {/* Google */}
              <Button
                onClick={handleGoogle}
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11 gap-2"
              >
                <Chrome className="h-4 w-4" />
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/30">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white/60">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-11 focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white/60">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-11 pr-10 focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/20"
                    onKeyDown={(e) => e.key === 'Enter' && (tab === 'signin' ? handleSignIn() : handleSignUp())}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                onClick={tab === 'signin' ? handleSignIn : handleSignUp}
                disabled={loading || !email || !password}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-semibold shadow-lg shadow-purple-500/20 transition-all"
              >
                {loading ? 'Loading...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
