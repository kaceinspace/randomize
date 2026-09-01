import { motion } from 'framer-motion'

export default function ManyRandomConfig({ count, max, onChange }) {
  const safeMax = Math.max(2, max)
  const safeCount = Math.min(Math.max(1, count), safeMax)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-sm text-white/70 uppercase tracking-widest">
          Jumlah Nama
        </span>
        <motion.div
          key={safeCount}
          initial={{ scale: 1.3, color: '#FFE600' }}
          animate={{ scale: 1, color: '#FAFAFA' }}
          className="font-mono font-black text-2xl"
        >
          {safeCount}
        </motion.div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          id="many-count-slider"
          type="range"
          min={1}
          max={safeMax}
          value={safeCount}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #1B4FFF 0%, #1B4FFF ${((safeCount - 1) / (safeMax - 1)) * 100}%, rgba(255,255,255,0.15) ${((safeCount - 1) / (safeMax - 1)) * 100}%, rgba(255,255,255,0.15) 100%)`,
            borderRadius: 0,
            accentColor: '#1B4FFF',
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="font-mono text-xs text-white/25">1</span>
          <span className="font-mono text-xs text-white/25">{safeMax}</span>
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-2 flex-wrap">
        {[2, 3, 5, 10].filter(v => v <= safeMax).map(v => (
          <motion.button
            key={v}
            onClick={() => onChange(v)}
            whileTap={{ scale: 0.9 }}
            className={`
              font-mono text-xs px-3 py-1 border-2 transition-all
              ${safeCount === v
                ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400 shadow-[2px_2px_0px_#FFE600]'
                : 'border-white/20 text-white/40 hover:border-white/50 hover:text-white'
              }
            `}
          >
            {v}
          </motion.button>
        ))}
        <motion.button
          onClick={() => onChange(safeMax)}
          whileTap={{ scale: 0.9 }}
          className={`
            font-mono text-xs px-3 py-1 border-2 transition-all
            ${safeCount === safeMax
              ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400 shadow-[2px_2px_0px_#FFE600]'
              : 'border-white/20 text-white/40 hover:border-white/50 hover:text-white'
            }
          `}
        >
          ALL ({safeMax})
        </motion.button>
      </div>

      {/* Direct number input */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 font-mono text-xs">atau ketik:</span>
        <input
          id="many-count-input"
          type="number"
          min={1}
          max={safeMax}
          value={safeCount}
          onChange={e => {
            const v = Math.min(Math.max(1, Number(e.target.value)), safeMax)
            onChange(v)
          }}
          className="brute-input w-20 px-2 py-1 text-sm text-center"
        />
      </div>
    </div>
  )
}
