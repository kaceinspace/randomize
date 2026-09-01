import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'

export default function NameInput({ names, onNamesChange }) {
  const [inputVal, setInputVal] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)

  const addNames = (raw) => {
    const newNames = raw
      .split(/[\n,;]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0 && !names.includes(n))
    if (newNames.length > 0) {
      onNamesChange([...names, ...newNames])
    }
    setInputVal('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputVal.trim()) addNames(inputVal)
    }
  }

  const removeName = (name) => {
    onNamesChange(names.filter(n => n !== name))
  }

  const clearAll = () => onNamesChange([])

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted.includes('\n') || pasted.includes(',') || pasted.includes(';')) {
      e.preventDefault()
      addNames(pasted)
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-base uppercase tracking-widest text-white">
            Daftar Nama
          </h2>
          <p className="text-white/40 text-xs font-mono">
            {names.length} nama terdaftar
          </p>
        </div>
        {names.length > 0 && (
          <motion.button
            onClick={clearAll}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs font-mono text-red-400/70 hover:text-red-400 border border-red-400/30 hover:border-red-400 px-2 py-1 transition-all"
          >
            CLEAR ALL
          </motion.button>
        )}
      </div>

      {/* Input */}
      <div className="relative">
        <motion.div
          animate={{ boxShadow: isFocused ? '4px 4px 0px #1B4FFF' : '4px 4px 0px rgba(255,255,255,0.1)', borderColor: isFocused ? '#1B4FFF' : 'rgba(255,255,255,0.2)' }}
          className="flex flex-col gap-2 p-2 border-2 bg-white/5 transition-all"
        >
          <textarea
            ref={inputRef}
            id="name-input-field"
            rows="3"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ketik banyak nama...&#10;(pisahkan dengan enter atau koma)"
            className="w-full px-2 py-1 text-sm bg-transparent text-white placeholder-white/30 resize-none outline-none font-sans"
          />
          <div className="flex justify-between items-center pl-2">
             <p className="text-white/30 text-[10px] font-mono leading-tight">
               Enter: Add | Shift+Enter: Baris Baru
             </p>
             <motion.button
               id="add-name-btn"
               onClick={() => inputVal.trim() && addNames(inputVal)}
               whileTap={{ scale: 0.92 }}
               className="brute-btn bg-brute-blue text-white px-4 py-1.5 text-xs"
             >
               + ADD
             </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Name Tags */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        {names.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-2 text-white/20"
          >
            <span className="text-4xl">📝</span>
            <p className="font-mono text-xs text-center">Belum ada nama.<br />Tambahkan di atas!</p>
          </motion.div>
        ) : (
          <div className="flex flex-wrap gap-2 content-start">
            <AnimatePresence>
              {names.map((name, i) => (
                <motion.div
                  key={name}
                  layout
                  initial={{ opacity: 0, scale: 0.5, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="name-tag group"
                >
                  <span className="text-white/50 font-mono text-xs">{i + 1}.</span>
                  <span className="font-medium text-white">{name}</span>
                  <button
                    onClick={() => removeName(name)}
                    className="text-white/30 hover:text-red-400 transition-colors ml-1 leading-none"
                    aria-label={`Remove ${name}`}
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Count badge */}
      {names.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-white/10 pt-2 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-mono text-xs text-white/40">
            {names.length} nama siap dirandom
          </span>
        </motion.div>
      )}
    </div>
  )
}
