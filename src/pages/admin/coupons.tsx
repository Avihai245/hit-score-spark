import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function AdminCoupons() {
  const [promos, setPromos] = useState<any[]>([]);
  const [promo, setPromo] = useState({ code: '', discount: '', type: 'percent' as 'percent' | 'amount' });

  useEffect(() => {
    supabase.from('admin_settings').select('value').eq('key', 'promo_codes').single()
      .then(({ data }) => { if (data?.value) setPromos(data.value as any[]); });
  }, []);

  const savePromos = async (updated: any[]) => {
    await supabase.from('admin_settings').upsert({ key: 'promo_codes', value: updated, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  };

  const handleAdd = async () => {
    if (!promo.code || !promo.discount) return;
    const updated = [...promos, { ...promo, id: Date.now(), uses: 0, created_at: new Date().toISOString() }];
    setPromos(updated);
    await savePromos(updated);
    toast.success(`Code ${promo.code} created`);
    setPromo({ code: '', discount: '', type: 'percent' });
  };

  const handleDelete = async (id: number) => {
    const updated = promos.filter(p => p.id !== id);
    setPromos(updated);
    await savePromos(updated);
    toast.success('Code deleted');
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Coupons & Promotions</h1>
            <p className="text-xs text-muted-foreground">Manage discount codes</p>
          </div>

          {/* Create */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-3">Create Coupon</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input value={promo.code} onChange={e => setPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="CODE"
                className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm uppercase" />
              <input value={promo.discount} onChange={e => setPromo(p => ({ ...p, discount: e.target.value }))} placeholder="Discount" type="number"
                className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm" />
              <select value={promo.type} onChange={e => setPromo(p => ({ ...p, type: e.target.value as any }))}
                className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm">
                <option value="percent">% Off</option>
                <option value="amount">$ Off</option>
              </select>
              <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg gap-1.5">
                <Plus className="w-4 h-4" /> Create
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {promos.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-primary" />
                    <code className="text-sm font-mono text-primary font-medium">{p.code}</code>
                  </div>
                  <span className="text-sm text-muted-foreground">{p.type === 'percent' ? `${p.discount}%` : `$${p.discount}`} off</span>
                  <span className="text-xs text-muted-foreground">{p.uses || 0} uses</span>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {promos.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No coupons yet</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
