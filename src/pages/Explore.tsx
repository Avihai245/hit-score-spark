import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

const GENRES = [
  { name: 'Pop', gradient: 'from-pink-500 to-rose-600', emoji: '🌟' },
  { name: 'Hip-Hop', gradient: 'from-yellow-500 to-orange-600', emoji: '🎤' },
  { name: 'R&B', gradient: 'from-purple-500 to-indigo-600', emoji: '🎶' },
  { name: 'EDM', gradient: 'from-cyan-500 to-blue-600', emoji: '⚡' },
  { name: 'Latin', gradient: 'from-red-500 to-yellow-500', emoji: '🔥' },
  { name: 'Rock', gradient: 'from-gray-600 to-gray-900', emoji: '🎸' },
  { name: 'Afrobeats', gradient: 'from-green-500 to-emerald-600', emoji: '🌍' },
  { name: 'Country', gradient: 'from-amber-500 to-yellow-700', emoji: '🤠' },
  { name: 'Trap', gradient: 'from-violet-600 to-purple-900', emoji: '💜' },
  { name: 'Indie', gradient: 'from-teal-400 to-cyan-600', emoji: '🎵' },
];

export default function Explore() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-black text-foreground">Explore</h1>
          </div>
          <p className="text-sm text-muted-foreground">Browse hit songs by genre</p>
        </div>

        {/* Genre tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {GENRES.map((genre, i) => (
            <motion.button
              key={genre.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/discover?genre=${encodeURIComponent(genre.name)}`)}
              className={`relative h-24 rounded-2xl bg-gradient-to-br ${genre.gradient} flex flex-col items-start justify-end p-3 overflow-hidden group hover:scale-[1.02] transition-transform`}
            >
              <span className="absolute top-3 right-3 text-2xl opacity-60 group-hover:opacity-90 transition-opacity">
                {genre.emoji}
              </span>
              <span className="text-sm font-bold text-white drop-shadow">{genre.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
