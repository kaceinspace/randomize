import { motion } from 'framer-motion'

export default function TeamBuilderConfig({ teamCount, max, onChange }) {
  const safeMax = Math.max(2, Math.min(max, 10))
  const safeCount = Math.min(Math.max(2, teamCount), safeMax)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-sm text-white/70 uppercase tracking-widest">
          Jumlah Tim
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
          id="team-count-slider"
          type="range"
          min={2}
          max={safeMax}
          value={safeCount}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #FFE600 0%, #FFE600 ${((safeCount - 2) / (safeMax - 2)) * 100}%, rgba(255,255,255,0.15) ${((safeCount - 2) / (safeMax - 2)) * 100}%, rgba(255,255,255,0.15) 100%)`,
            borderRadius: 0,
            accentColor: '#FFE600',
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="font-mono text-xs text-white/25">2</span>
          <span className="font-mono text-xs text-white/25">{safeMax} tim</span>
        </div>
      </div>

      {/* Quick select */}
      <div className="flex gap-2 flex-wrap">
        {[2, 3, 4, 5, 6, 8, 10].filter(v => v <= safeMax).map(v => (
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
            {v} Tim
          </motion.button>
        ))}
      </div>

      {/* Preview of team sizes */}
      {max > 0 && (
        <div className="glass border border-white/10 p-3">
          <p className="font-mono text-xs text-white/40 mb-2">Preview distribusi:</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: safeCount }, (_, i) => {
              const baseSize = Math.floor(max / safeCount)
              const extra = i < (max % safeCount) ? 1 : 0
              const size = baseSize + extra
              return (
                <div
                  key={i}
                  className={`text-xs font-mono px-2 py-1 border ${i % 2 === 0 ? 'border-blue-400/40 text-blue-300' : 'border-yellow-400/40 text-yellow-300'}`}
                >
                  Tim {i + 1}: {size}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
