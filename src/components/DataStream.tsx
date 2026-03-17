import { motion } from 'framer-motion';

/** Animated vertical data streams — cinematic filler for processing screens */
export const DataStream = ({ columns = 8 }: { columns?: number }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07]">
    {Array.from({ length: columns }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute top-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent"
        style={{ left: `${(i + 1) * (100 / (columns + 1))}%`, height: '120%' }}
        animate={{ y: ['-20%', '20%'] }}
        transition={{ repeat: Infinity, duration: 3 + Math.random() * 4, ease: 'linear', delay: Math.random() * 2 }}
      />
    ))}
    {Array.from({ length: columns }).map((_, i) => (
      <motion.div
        key={`dot-${i}`}
        className="absolute w-1 h-1 rounded-full bg-primary"
        style={{ left: `${(i + 1) * (100 / (columns + 1))}%` }}
        animate={{ y: ['0%', '100%'], opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2 + Math.random() * 3, ease: 'linear', delay: Math.random() * 3 }}
      />
    ))}
  </div>
);

/** Horizontal scanning line effect */
export const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
    animate={{ top: ['0%', '100%'] }}
    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
  />
);
