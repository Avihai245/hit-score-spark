import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle, MessageSquare, BookOpen, Search, ChevronRight,
  FileText, Headphones, CreditCard, Settings, ExternalLink,
} from 'lucide-react';
import { useState } from 'react';

const FAQ = [
  { q: 'How does the viral score work?', a: 'Our AI analyzes multiple dimensions of your song including hook strength, structure, energy, and market fit against a database of viral patterns across Spotify, TikTok, and Apple Music.' },
  { q: 'How long does an analysis take?', a: 'Most analyses complete in under 60 seconds. Complex files or high traffic may take up to 2 minutes.' },
  { q: 'Can I re-analyze the same song?', a: 'Yes! Each re-analysis uses one credit. This is useful after making improvements based on our recommendations.' },
  { q: 'What audio formats are supported?', a: 'We accept MP3, WAV, FLAC, AAC, and OGG files up to 50MB.' },
  { q: 'How do AI remixes work?', a: 'Our AI creates a new version of your song optimized for virality based on the analysis insights. Available on Pro and Studio plans.' },
];

const CATEGORIES = [
  { icon: <Headphones className="w-5 h-5" />, label: 'Analysis & Scores', count: 8 },
  { icon: <CreditCard className="w-5 h-5" />, label: 'Billing & Plans', count: 5 },
  { icon: <Settings className="w-5 h-5" />, label: 'Account & Settings', count: 4 },
  { icon: <FileText className="w-5 h-5" />, label: 'Getting Started', count: 6 },
];

export default function Support() {
  const [search, setSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaq = FAQ.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
          <p className="text-sm text-muted-foreground">Find answers or contact our team</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search help articles..."
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <button key={cat.label} className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors group">
              <div className="text-muted-foreground group-hover:text-primary transition-colors mb-2">{cat.icon}</div>
              <p className="text-sm font-medium text-foreground">{cat.label}</p>
              <p className="text-xs text-muted-foreground">{cat.count} articles</p>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" /> Frequently Asked Questions
            </h2>
          </div>
          <div className="divide-y divide-border">
            {filteredFaq.map((faq, i) => (
              <button
                key={i}
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{faq.q}</p>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`} />
                </div>
                {expandedFaq === i && (
                  <p className="text-sm text-muted-foreground mt-2 pr-8">{faq.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-foreground">Need more help?</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Our support team typically responds within 24 hours
              </p>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg text-xs gap-1.5 shrink-0">
              <ExternalLink className="w-3.5 h-3.5" /> Contact Support
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
