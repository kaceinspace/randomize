import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function PairMode({ names, pairs, onPairsChange }) {
  const [dragOver, setDragOver] = useState(null)

  const addToPairGroup = (group, name) => {
    const other = group === 'A' ? 'B' : 'A'
    const key = group === 'A' ? 'groupA' : 'groupB'
    const otherKey = other === 'A' ? 'groupA' : 'groupB'

    // Remove from other group if there
    const newOther = (pairs[otherKey] || []).filter(n => n !== name)
    const newGroup = [...new Set([...(pairs[key] || []), name])]

    onPairsChange({ ...pairs, [key]: newGroup, [otherKey]: newOther })
  }

  const removeFromGroup = (group, name) => {
    const key = group === 'A' ? 'groupA' : 'groupB'
    onPairsChange({ ...pairs, [key]: (pairs[key] || []).filter(n => n !== name) })
  }

  const unassigned = names.filter(
    n => !(pairs.groupA || []).includes(n) && !(pairs.groupB || []).includes(n)
  )

  const groupColors = {
    A: { border: 'border-blue-400/40', bg: 'bg-blue-900/20', text: 'text-blue-300', btn: 'bg-blue-600 hover:bg-blue-500' },
    B: { border: 'border-yellow-400/40', bg: 'bg-yellow-900/10', text: 'text-yellow-300', btn: 'bg-yellow-500 hover:bg-yellow-400 text-black' },
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display font-bold text-sm text-white/70 uppercase tracking-widest">Setup Pasangan</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Group A & B */}
      <div className="grid grid-cols-2 gap-3">
        {['A', 'B'].map(group => {
          const key = group === 'A' ? 'groupA' : 'groupB'
          const members = pairs[key] || []
          const c = groupColors[group]
          return (
            <div
              key={group}
              onDragOver={e => { e.preventDefault(); setDragOver(group) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => {
                e.preventDefault()
                const name = e.dataTransfer.getData('text/plain')
                addToPairGroup(group, name)
                setDragOver(null)
              }}
              className={`
                border-2 ${c.border} ${c.bg} p-3 min-h-[120px] transition-all
                ${dragOver === group ? 'scale-105 brightness-125' : ''}
              `}
            >
              <div className={`font-display font-bold text-sm uppercase tracking-wide mb-2 ${c.text}`}>
                Kelompok {group}
                <span className="text-white/30 font-mono font-normal text-xs ml-2">({members.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {members.map(name => (
                    <motion.div
                      key={name}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="flex items-center gap-1 text-xs font-mono bg-white/10 border border-white/15 px-2 py-0.5"
                    >
                      <span className="text-white">{name}</span>
                      <button
                        onClick={() => removeFromGroup(group, name)}
                        className="text-white/30 hover:text-red-400 text-xs ml-0.5"
                      >×</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {members.length === 0 && (
                  <p className="text-white/20 text-xs font-mono italic">
                    Drag nama ke sini atau klik +
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unassigned names */}
      {unassigned.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <p className="text-white/40 text-xs font-mono mb-2">Nama belum ditetapkan — klik untuk masukkan kelompok:</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map(name => (
              <motion.div
                key={name}
                draggable
                onDragStart={e => e.dataTransfer.setData('text/plain', name)}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="cursor-grab active:cursor-grabbing"
              >
                <div className="group flex items-center border border-white/20 bg-white/5 text-white text-xs font-mono px-2 py-1 gap-1">
                  <span className="text-white/60 group-hover:text-white transition-colors">{name}</span>
                  <div className="flex gap-1 ml-1">
                    <button
                      onClick={() => addToPairGroup('A', name)}
                      className="text-blue-400 hover:bg-blue-400 hover:text-white px-1 transition-all text-xs border border-blue-400/40 hover:border-blue-400"
                      title="Masukkan ke Kelompok A"
                    >A</button>
                    <button
                      onClick={() => addToPairGroup('B', name)}
                      className="text-yellow-400 hover:bg-yellow-400 hover:text-black px-1 transition-all text-xs border border-yellow-400/40 hover:border-yellow-400"
                      title="Masukkan ke Kelompok B"
                    >B</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Auto assign button */}
      {names.length > 0 && (
        <motion.button
          id="auto-assign-pair-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            // Auto-split names evenly into A and B
            const half = Math.ceil(names.length / 2)
            onPairsChange({
              groupA: names.slice(0, half),
              groupB: names.slice(half),
            })
          }}
          className="text-xs font-mono border border-white/20 hover:border-blue-400 text-white/50 hover:text-blue-400 py-2 transition-all"
        >
          ⚡ AUTO SPLIT (bagi rata ke A & B)
        </motion.button>
      )}
    </div>
  )
}
