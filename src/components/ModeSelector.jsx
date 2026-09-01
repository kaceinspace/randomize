import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'

const MODES = [
  { id: 'single', label: 'Single', emoji: '🎯', desc: 'Pilih 1 nama acak', color: 'blue' },
  { id: 'spinner', label: 'Spinner', emoji: '🎡', desc: 'Putar roda keberuntungan', color: 'yellow' },
  { id: 'double', label: 'Double', emoji: '🎲', desc: 'Pilih 2 nama acak', color: 'yellow' },
  { id: 'many', label: 'Many', emoji: '🌀', desc: 'Pilih N nama acak', color: 'blue' },
  { id: 'pair', label: 'Pair', emoji: '🔗', desc: 'Pasangkan 1-lawan-1', color: 'yellow' },
  { id: 'team', label: 'Team', emoji: '👥', desc: 'Bagi ke N tim', color: 'blue' },
]

export default function ModeSelector({ activeMode, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs uppercase tracking-widest text-white/40 mb-1">Mode Randomize</p>
      {MODES.map((mode, i) => (
        <motion.button
          key={mode.id}
          id={`mode-btn-${mode.id}`}
          onClick={() => onSelect(mode.id)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07, type: 'spring', stiffness: 200 }}
          whileTap={{ scale: 0.96 }}
          className={`
            relative flex items-center gap-3 p-3 text-left w-full
            border-2 transition-all duration-150 group
            ${activeMode === mode.id
              ? 'border-yellow-300 bg-yellow-400/10 shadow-[4px_4px_0px_#FFE600]'
              : 'border-white/20 bg-white/[0.04] hover:border-white/50 hover:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]'
            }
          `}
        >
          {/* Active indicator stripe */}
          <AnimatePresence>
            {activeMode === mode.id && (
              <motion.div
                layoutId="mode-active-bar"
                className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          <span className="text-xl pl-1">{mode.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className={`font-display font-bold text-sm uppercase tracking-wide
              ${activeMode === mode.id ? 'text-yellow-300' : 'text-white group-hover:text-blue-300'}`}>
              {mode.label}
            </div>
            <div className="text-white/40 text-xs font-mono mt-0.5 truncate">{mode.desc}</div>
          </div>
          <motion.span
            animate={{ x: activeMode === mode.id ? 0 : -4, opacity: activeMode === mode.id ? 1 : 0 }}
            className="text-yellow-400 font-mono font-bold text-sm"
          >
            →
          </motion.span>
        </motion.button>
      ))}
    </div>
  )
}
