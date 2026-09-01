import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback, useRef } from 'react'
import html2canvas from 'html2canvas'
import { useStore } from '../store'
import { playPop, playChampion, playSpinStart } from '../utils/sounds'
import { fireConfetti, fireChampionConfetti } from '../utils/confetti'

// ─── Layout Constants ──────────────────────────────────────────────────────
const CARD_H = 52    // height of each matchup card (px)
const CARD_GAP = 4   // gap between cards in same round (px)
const CARD_W = 152   // width of matchup card (px)
const CONN_W = 28    // width of SVG connector between rounds (px)

// ─── Utilities ─────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function nextPow2(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

/**
 * Standard tournament bracket seed order (the same recursive scheme
 * Challonge / NCAA-style brackets use): for a bracket of `size`,
 * returns the seed number that belongs in each slot, in slot order.
 * e.g. size=8 → [1,8,4,5,2,7,3,6] → Round 1 pairs are (1v8),(4v5),(2v7),(3v6).
 *
 * The key property: the weakest seeds (which become BYEs when there
 * are fewer real players than bracketSize) end up spread one-per-match
 * instead of clumped together — so real players get single BYEs and
 * you basically never end up with a dead "BYE vs BYE" match, unlike
 * naive sequential padding.
 */
function seedOrder(size) {
  let seeds = [1]
  while (seeds.length < size) {
    const n = seeds.length * 2
    const next = []
    seeds.forEach(s => {
      next.push(s)
      next.push(n + 1 - s)
    })
    seeds = next
  }
  return seeds
}

/**
 * Returns the top Y position (px) of matchup card [r, i] within the bracket.
 * All rounds share the same total bracket height.
 */
function getMatchupY(r, i, numRounds) {
  const r0Count = Math.pow(2, numRounds - 1)
  const totalH = r0Count * (CARD_H + CARD_GAP) - CARD_GAP
  const matchCount = Math.pow(2, numRounds - 1 - r)
  const slotH = totalH / matchCount
  return i * slotH + (slotH - CARD_H) / 2
}

// ─── Bracket Builder ────────────────────────────────────────────────────────
function buildBracket(names, tournamentName) {
  const shuffled = shuffle(names)
  const bracketSize = nextPow2(shuffled.length)
  const numRounds = Math.log2(bracketSize)

  // Place shuffled players into slots using standard bracket seeding
  // (see seedOrder above) instead of "real players packed at the front,
  // BYEs padded at the back". Sequential padding clumps all the BYEs
  // into dead double-BYE ("ghost") matches at the bottom of the bracket.
  // Seeded placement spreads BYEs one-per-match whenever mathematically
  // possible (which is always true unless the player count is itself a
  // power of 2, in which case there are no BYEs at all).
  const order = seedOrder(bracketSize)
  const slots = order.map(seed =>
    seed <= shuffled.length ? shuffled[seed - 1] : null
  )

  // Build Round 0
  const r0 = []
  for (let i = 0; i < bracketSize; i += 2) {
    const a = slots[i]
    const b = slots[i + 1]
    // A "ghost" slot is one that will NEVER have real players (both padding).
    // A "bye" slot has exactly one real player who auto-advances.
    // These must be tracked as an explicit flag — not re-derived later from
    // a/b being null, because an undecided real match also looks like
    // "a === null && b === null" until its feeders are actually played.
    const isGhost = a === null && b === null
    const isBye = !isGhost && (a === null || b === null)
    const winner = isBye ? (a ?? b) : null
    r0.push({ a, b, winner, isBye, isGhost, scoreA: null, scoreB: null })
  }

  // Pre-build all future rounds, propagating ghost status structurally
  // (this is knowable purely from bracket shape, before anything is played).
  const rounds = [r0]
  for (let r = 1; r < numRounds; r++) {
    const prev = rounds[r - 1]
    const count = Math.max(1, prev.length / 2)
    const round = []
    for (let ni = 0; ni < count; ni++) {
      const f1 = prev[ni * 2]
      const f2 = prev[ni * 2 + 1]
      const isGhost = (f1 ? f1.isGhost : true) && (f2 ? f2.isGhost : true)
      round.push({ a: null, b: null, winner: null, isBye: false, isGhost, scoreA: null, scoreB: null })
    }
    rounds.push(round)
  }

  let tournament = {
    name: tournamentName || 'Tournament',
    bracketSize,
    numRounds,
    rounds,
    currentRound: 0,
    champion: null,
  }

  // Cascade-propagate BYEs through ALL rounds (not just R0)
  // so players who get multiple BYEs flow through to the correct spot
  for (let r = 0; r < numRounds - 1; r++) {
    tournament = propagateWinners(tournament, r)
  }

  return tournament
}

/**
 * After matchups in round `roundIndex` are resolved, propagate winners into
 * the next round's slots (a or b depending on index parity).
 *
 * KEY FIX: A feeder matchup only counts as "done" when it has an actual
 * winner, OR when it is a structural ghost (guaranteed-empty slot, flagged
 * at build time). We deliberately do NOT infer "done" from a/b being null,
 * because an undecided real match also has a === null / b === null in the
 * NEXT round's shell until someone picks a winner — treating that as
 * "ghost" caused later rounds (e.g. the Final) to auto-resolve as a BYE
 * before earlier real matches had even been played.
 */
function propagateWinners(tournament, roundIndex) {
  if (roundIndex >= tournament.rounds.length - 1) return tournament

  const cur = tournament.rounds[roundIndex]
  const next = tournament.rounds[roundIndex + 1].map(m => ({ ...m }))

  // Fill winner slots into the next round
  cur.forEach((matchup, i) => {
    if (matchup.winner === null) return  // skip unresolved real matchups
    const ni = Math.floor(i / 2)
    const slot = i % 2 === 0 ? 'a' : 'b'
    if (ni < next.length) next[ni] = { ...next[ni], [slot]: matchup.winner }
  })

  const isFeederDone = (m) => !m || m.winner !== null || m.isGhost

  // Auto-resolve BYE ONLY when BOTH feeder matchups for this slot are fully done.
  const resolved = next.map((m, ni) => {
    const f1 = cur[ni * 2]
    const f2 = cur[ni * 2 + 1]
    if (!isFeederDone(f1) || !isFeederDone(f2)) return m  // wait for both feeders
    if (m.a !== null && m.b === null) return { ...m, winner: m.a, isBye: true }
    if (m.a === null && m.b !== null) return { ...m, winner: m.b, isBye: true }
    return m
  })

  const newRounds = tournament.rounds.map((r, ri) =>
    ri === roundIndex + 1 ? resolved : r
  )
  return { ...tournament, rounds: newRounds }
}

// ─── SVG Connectors ─────────────────────────────────────────────────────────
function ConnectorSVG({ fromYs, toYs, totalH }) {
  const MIDX = CONN_W / 2
  const COLOR = 'rgba(255,255,255,0.18)'

  return (
    <svg width={CONN_W} height={totalH} className="flex-shrink-0" style={{ overflow: 'visible' }}>
      {toYs.map((toY, i) => {
        const topY = fromYs[i * 2] + CARD_H / 2
        const botY = fromYs[i * 2 + 1] !== undefined
          ? fromYs[i * 2 + 1] + CARD_H / 2
          : topY
        const midY = toY + CARD_H / 2

        return (
          <g key={i}>
            <line x1={0} y1={topY} x2={MIDX} y2={topY} stroke={COLOR} strokeWidth={1.5} />
            {fromYs[i * 2 + 1] !== undefined && (
              <>
                <line x1={0} y1={botY} x2={MIDX} y2={botY} stroke={COLOR} strokeWidth={1.5} />
                <line x1={MIDX} y1={topY} x2={MIDX} y2={botY} stroke={COLOR} strokeWidth={1.5} />
              </>
            )}
            <line x1={MIDX} y1={midY} x2={CONN_W} y2={midY} stroke={COLOR} strokeWidth={1.5} />
          </g>
        )
      })}
    </svg>
  )
}

// ─── Matchup Card ────────────────────────────────────────────────────────────
function MatchupCard({ matchup, r, i, numRounds, isActive, canInteract, onPick, onScoreChange }) {
  const y = getMatchupY(r, i, numRounds)
  const hasWinner = matchup.winner !== null
  // Use the explicit structural flag — NOT a/b nullness — so an undecided
  // real match (still a === null / b === null while waiting on earlier
  // rounds) renders as a proper "TBD" slot instead of a dead "bye" box.
  const isGhost = matchup.isGhost

  // Ghost slot (both BYE — appears when participants < bracketSize and paired with another BYE)
  if (isGhost) {
    return (
      <div
        className="absolute border border-white/5 flex items-center justify-center opacity-20"
        style={{ top: y, width: CARD_W, height: CARD_H }}
      >
        <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">bye</span>
      </div>
    )
  }

  // BYE slot (one real player, other is null)
  if (matchup.isBye) {
    return (
      <div
        className="absolute border border-yellow-400/20 bg-yellow-400/5 flex items-center gap-2 px-2 opacity-80"
        style={{ top: y, width: CARD_W, height: CARD_H }}
      >
        <span className="text-yellow-400/60 text-xs flex-shrink-0">⚡</span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] text-yellow-400/50 uppercase">auto bye</p>
          <p className="font-bold text-[11px] text-white truncate">{matchup.winner}</p>
        </div>
      </div>
    )
  }

  // Future TBD slot
  if (matchup.a === null || matchup.b === null) {
    return (
      <div
        className="absolute border border-white/10 opacity-30 flex flex-col divide-y divide-white/10"
        style={{ top: y, width: CARD_W, height: CARD_H }}
      >
        {[matchup.a, matchup.b].map((p, j) => (
          <div key={j} className="flex-1 flex items-center px-2 gap-2">
            <span className="w-2 h-2 rounded-full bg-white/10 flex-shrink-0" />
            <span className="font-mono text-[10px] text-white/20">{p ?? 'TBD'}</span>
          </div>
        ))}
      </div>
    )
  }

  // Real matchup — score entry drives the winner automatically once both
  // scores are filled in and differ. Clicking a name still works too, as
  // a quick manual override for whoever doesn't want to type scores.
  const isTie = matchup.scoreA !== null && matchup.scoreB !== null && matchup.scoreA === matchup.scoreB

  return (
    <div
      className={`absolute border flex flex-col divide-y overflow-hidden transition-all ${hasWinner
        ? 'border-yellow-400/40 divide-yellow-400/15'
        : isActive
          ? 'border-blue-400/60 divide-blue-400/20 shadow-[0_0_10px_rgba(27,79,255,0.25)]'
          : 'border-white/20 divide-white/10'
        }`}
      style={{ top: y, width: CARD_W, height: CARD_H }}
    >
      {[matchup.a, matchup.b].map((player, j) => {
        const scoreKey = j === 0 ? 'scoreA' : 'scoreB'
        const scoreVal = matchup[scoreKey]
        const showScoreInput = canInteract && !hasWinner

        return (
          <div
            key={j}
            className={`flex-1 flex items-center gap-1 pl-2 pr-1 min-w-0 transition-all group ${matchup.winner === player ? 'bg-yellow-400/15' : ''
              }`}
          >
            <button
              onClick={() => canInteract && player && !hasWinner && onPick(r, i, player)}
              disabled={!canInteract || hasWinner}
              className={`flex items-center gap-1.5 flex-1 min-w-0 text-left ${canInteract && !hasWinner ? 'hover:bg-blue-500/20 cursor-pointer' : ''
                }`}
            >
              {matchup.winner === player
                ? <span className="text-yellow-400 text-[11px] leading-none flex-shrink-0">★</span>
                : isActive && !hasWinner
                  ? <span className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0 group-hover:border-blue-400 transition-colors" />
                  : <span className="w-2.5 flex-shrink-0" />
              }
              <span className={`font-bold text-[11px] truncate transition-all ${hasWinner && matchup.winner !== player
                ? 'text-white/25 line-through decoration-white/20'
                : 'text-white'
                }`}>
                {player}
              </span>
            </button>

            {showScoreInput && (
              <input
                type="number"
                inputMode="numeric"
                value={scoreVal ?? ''}
                onClick={e => e.stopPropagation()}
                onChange={e => onScoreChange(r, i, scoreKey, e.target.value)}
                className={`w-9 flex-shrink-0 bg-white/10 border text-white text-[10px] font-mono text-center py-0.5 outline-none transition-colors ${isTie ? 'border-red-400/60' : 'border-white/20 focus:border-blue-400'
                  }`}
                placeholder="0"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Round Label ─────────────────────────────────────────────────────────────
function roundLabel(r, totalRounds) {
  if (r === totalRounds - 1) return 'FINAL'
  if (totalRounds > 2 && r === totalRounds - 2) return 'SEMI'
  if (totalRounds > 3 && r === totalRounds - 3) return 'QF'
  return `R${r + 1}`
}

// ─── Export helper ───────────────────────────────────────────────────────────
async function exportNodeAsImage(node, filename) {
  if (!node) return
  try {
    const canvas = await html2canvas(node, {
      backgroundColor: '#0a0a0a',
      scale: 2,
      useCORS: true,
    })
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('Export gagal:', err)
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TournamentMode({ names }) {
  const { tournament, setTournament } = useStore()
  const [isAnimating, setIsAnimating] = useState(false)
  const [draftName, setDraftName] = useState('Tournament 2024')
  const bracketInnerRef = useRef(null)
  const championRef = useRef(null)

  // ── Derived state ──
  const curRound = tournament?.currentRound ?? 0
  const numRounds = tournament?.numRounds ?? 0
  const r0Count = numRounds > 0 ? Math.pow(2, numRounds - 1) : 1
  const totalH = Math.max(52, r0Count * (CARD_H + CARD_GAP) - CARD_GAP)
  const isFinalRound = tournament ? curRound === tournament.rounds.length - 1 : false

  // A matchup is "complete" if it has a winner OR is a structural ghost slot.
  const isMatchupComplete = (m) => m.winner !== null || m.isGhost
  const allComplete = tournament
    ? tournament.rounds[curRound].every(isMatchupComplete)
    : false
  const pendingCount = tournament
    ? tournament.rounds[curRound].filter(m => !isMatchupComplete(m)).length
    : 0

  const roundYPositions = tournament
    ? tournament.rounds.map((round, r) =>
      round.map((_, i) => getMatchupY(r, i, tournament.numRounds))
    )
    : []

  // ── Handlers ──
  const startTournament = () => {
    if (names.length < 2) return
    playSpinStart()
    setTournament(buildBracket(names, draftName))
  }

  const resetTournament = () => setTournament(null)

  const pickWinner = useCallback((r, i, winner) => {
    if (!tournament || isAnimating) return
    playPop()
    fireConfetti()
    const newRounds = tournament.rounds.map((round, ri) =>
      ri !== r ? round : round.map((m, mi) => mi !== i ? m : { ...m, winner })
    )
    let updated = propagateWinners({ ...tournament, rounds: newRounds }, r)
    setTournament(updated)
  }, [tournament, isAnimating, setTournament])

  // Update a matchup's score. Once both scores are in and they differ, the
  // higher score automatically becomes the winner and propagates forward —
  // same downstream logic as clicking a name (pickWinner), just triggered
  // by score entry instead of a click.
  const updateScore = useCallback((r, i, key, rawValue) => {
    if (!tournament || isAnimating) return
    const value = rawValue === '' ? null : Math.max(0, parseInt(rawValue, 10) || 0)

    const newRounds = tournament.rounds.map((round, ri) =>
      ri !== r ? round : round.map((m, mi) => mi !== i ? m : { ...m, [key]: value })
    )
    const m = newRounds[r][i]

    if (m.scoreA !== null && m.scoreB !== null && m.scoreA !== m.scoreB && m.winner === null) {
      const winner = m.scoreA > m.scoreB ? m.a : m.b
      playPop()
      fireConfetti()
      const wonRounds = newRounds.map((round, ri) =>
        ri !== r ? round : round.map((mm, mi) => mi !== i ? mm : { ...mm, winner })
      )
      setTournament(propagateWinners({ ...tournament, rounds: wonRounds }, r))
    } else {
      setTournament({ ...tournament, rounds: newRounds })
    }
  }, [tournament, isAnimating, setTournament])

  const randomizeRound = async () => {
    if (!tournament || isAnimating) return
    setIsAnimating(true)
    playSpinStart()

    let t = { ...tournament, rounds: tournament.rounds.map(r => [...r.map(m => ({ ...m }))]) }

    for (let i = 0; i < t.rounds[curRound].length; i++) {
      const m = t.rounds[curRound][i]
      if (m.winner !== null || !m.a || !m.b) continue
      await new Promise(res => setTimeout(res, 280))
      const winner = Math.random() < 0.5 ? m.a : m.b
      playPop()
      const newRounds = t.rounds.map((round, ri) =>
        ri !== curRound ? round : round.map((mm, mi) => mi !== i ? mm : { ...mm, winner })
      )
      t = propagateWinners({ ...t, rounds: newRounds }, curRound)
      setTournament({ ...t })
    }

    setIsAnimating(false)
  }

  const advanceRound = () => {
    if (!tournament || !allComplete) return
    if (isFinalRound) {
      const champion = tournament.rounds[curRound][0].winner
      playChampion()
      fireChampionConfetti()
      setTournament({ ...tournament, champion })
    } else {
      fireConfetti()
      playSpinStart()
      setTournament({ ...tournament, currentRound: curRound + 1 })
    }
  }

  const exportBracketImage = () => {
    if (!tournament) return
    exportNodeAsImage(bracketInnerRef.current, `${tournament.name.replace(/\s+/g, '_')}_bracket.png`)
  }

  const exportChampionImage = () => {
    if (!tournament) return
    exportNodeAsImage(championRef.current, `${tournament.name.replace(/\s+/g, '_')}_juara.png`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHAMPION SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (tournament?.champion) {
    return (
      <div className="flex flex-col items-center gap-4 py-3">
        <div ref={championRef} className="flex flex-col items-center gap-4 py-3 px-2 w-full">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 10 }}
            className="text-5xl"
          >
            🏆
          </motion.div>

          <div className="text-center">
            <p className="font-mono text-[9px] text-yellow-400/50 uppercase tracking-widest mb-1">
              {tournament.name}
            </p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display font-black text-3xl text-yellow-400"
            >
              {tournament.champion}
            </motion.p>
            <p className="font-mono text-xs text-white/30 mt-1">
              🎉 Selamat, Juara!
            </p>
          </div>

          {/* Bracket summary */}
          <div className="w-full border border-white/10 p-3 text-xs font-mono space-y-0.5">
            <p className="text-white/30 uppercase tracking-widest text-[9px] mb-1">Ringkasan Bracket</p>
            {tournament.rounds.map((round, ri) => (
              <p key={ri} className="text-white/40">
                <span className="text-white/20">{roundLabel(ri, tournament.numRounds)}:</span>{' '}
                {round.filter(m => m.winner && !m.isBye).map(m => {
                  const score = m.scoreA !== null && m.scoreB !== null ? ` (${m.scoreA}-${m.scoreB})` : ''
                  return `${m.a} vs ${m.b}${score} → ${m.winner}`
                }).join(' | ')}
              </p>
            ))}
          </div>
        </div>

        <div className="w-full flex gap-2">
          <motion.button
            onClick={exportChampionImage}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 font-mono font-bold text-sm border-2 border-white/20 text-white/70 hover:bg-white/5 transition-all uppercase"
          >
            📸 Export Gambar
          </motion.button>
          <motion.button
            onClick={resetTournament}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 font-mono font-bold text-sm border-2 border-yellow-400/60 text-yellow-400 hover:bg-yellow-400/10 transition-all uppercase"
          >
            🔄 Tournament Baru
          </motion.button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // START SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (!tournament) {
    const bSize = nextPow2(Math.max(names.length, 2))
    const byeCount = bSize - names.length
    const nRounds = Math.log2(bSize)

    return (
      <div className="flex flex-col gap-4 py-2">
        {/* Tournament name input */}
        <div>
          <label className="font-mono text-[10px] text-white/40 uppercase tracking-widest block mb-1.5">
            Nama Tournament
          </label>
          <input
            type="text"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            className="w-full bg-white/5 border-2 border-white/15 focus:border-blue-400 hover:border-white/30 px-3 py-2 text-white font-bold text-sm outline-none transition-all"
            placeholder="Nama tournament..."
            maxLength={40}
          />
        </div>

        {/* Info card */}
        {names.length >= 2 && (
          <div className="glass border border-white/10 p-3 text-xs font-mono space-y-1.5">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white/60 font-bold">{names.length} peserta</span>
              <span className="text-white/20">·</span>
              <span className="text-blue-400">{nRounds} ronde</span>
              <span className="text-white/20">·</span>
              <span className="text-white/40">Bracket {bSize}</span>
            </div>
            {byeCount > 0 && (
              <p className="text-yellow-400/70">
                ⚡ {byeCount} peserta dapat BYE (lolos otomatis ke ronde berikutnya)
              </p>
            )}
            <p className="text-white/30">• Isi skor tiap pemain untuk menentukan pemenang otomatis</p>
            <p className="text-white/30">• Atau klik nama untuk pilih pemenang manual</p>
            <p className="text-white/30">• Atau klik "Randomize" untuk acak semua</p>
          </div>
        )}

        <motion.button
          onClick={startTournament}
          disabled={names.length < 2}
          whileHover={names.length >= 2 ? { scale: 1.02 } : {}}
          whileTap={names.length >= 2 ? { scale: 0.98 } : {}}
          className={`w-full py-4 font-display font-black text-base uppercase tracking-widest border-2 transition-all ${names.length >= 2
            ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 shadow-[4px_4px_0px_#FFE600] cursor-pointer'
            : 'border-white/20 text-white/30 cursor-not-allowed'
            }`}
        >
          {names.length < 2 ? 'Minimal 2 nama dulu!' : `🏆 Mulai "${draftName}"!`}
        </motion.button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BRACKET VIEW
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display font-black text-sm text-white truncate">
            🏆 {tournament.name}
          </p>
          <p className="font-mono text-[10px] text-white/35 mt-0.5">
            {allComplete
              ? isFinalRound
                ? 'Final selesai! Umumkan juara →'
                : `${roundLabel(curRound, numRounds)} selesai! Lanjut →`
              : `${roundLabel(curRound, numRounds)} · ${pendingCount} matchup tersisa`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <button
            onClick={exportBracketImage}
            className="font-mono text-[10px] text-white/30 hover:text-blue-400 transition-colors"
          >
            📸 export
          </button>
          <button
            onClick={resetTournament}
            className="font-mono text-[10px] text-white/20 hover:text-red-400 transition-colors"
          >
            ✕ reset
          </button>
        </div>
      </div>

      {/* ─── Bracket ─── */}
      <div className="overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div
          ref={bracketInnerRef}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            paddingTop: 24,
            paddingBottom: 4,
            minWidth: 'max-content',
          }}
        >
          {tournament.rounds.map((round, r) => (
            <div key={r} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
              {/* Round column */}
              <div style={{ width: CARD_W, height: totalH, position: 'relative', flexShrink: 0 }}>
                {/* Round label */}
                <div
                  className={`absolute text-center font-mono text-[9px] uppercase tracking-widest left-0 right-0 ${r === curRound ? 'text-blue-400 font-bold' :
                    r < curRound ? 'text-yellow-400/50' :
                      'text-white/15'
                    }`}
                  style={{ top: -18 }}
                >
                  {roundLabel(r, numRounds)}
                  {r === curRound && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse align-middle" />
                  )}
                </div>

                {/* Matchup cards */}
                {round.map((matchup, i) => (
                  <MatchupCard
                    key={`${r}-${i}`}
                    matchup={matchup}
                    r={r}
                    i={i}
                    numRounds={tournament.numRounds}
                    isActive={r === curRound}
                    canInteract={r === curRound && !isAnimating}
                    onPick={pickWinner}
                    onScoreChange={updateScore}
                  />
                ))}
              </div>

              {/* Connector SVG */}
              {r < tournament.rounds.length - 1 && (
                <ConnectorSVG
                  fromYs={roundYPositions[r]}
                  toYs={roundYPositions[r + 1]}
                  totalH={totalH}
                />
              )}
            </div>
          ))}

          {/* Champion box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: totalH,
              marginLeft: 4,
              flexShrink: 0,
            }}
          >
            {/* Mini connector to champion */}
            <svg width={CONN_W / 2} height={totalH} style={{ flexShrink: 0 }}>
              <line
                x1={0} y1={totalH / 2}
                x2={CONN_W / 2} y2={totalH / 2}
                stroke="rgba(255,255,255,0.18)" strokeWidth={1.5}
              />
            </svg>

            <motion.div
              animate={tournament.champion ? {
                boxShadow: ['3px 3px 0px #FFE600', '5px 5px 0px #FFE600', '3px 3px 0px #FFE600'],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`border-2 p-2 flex-shrink-0 transition-all ${tournament.champion
                ? 'border-yellow-400'
                : allComplete && isFinalRound
                  ? 'border-yellow-400/50 animate-pulse'
                  : 'border-white/10 opacity-30'
                }`}
              style={{ width: CARD_W - 24 }}
            >
              <p className="font-mono text-[9px] text-yellow-400/60 uppercase mb-0.5">🏆 Juara</p>
              <p className={`font-bold text-xs truncate ${tournament.champion ? 'text-yellow-400' : 'text-white/20'
                }`}>
                {tournament.champion ?? '???'}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="flex gap-2">
        <AnimatePresence mode="wait">
          {!allComplete && (
            <motion.button
              key="randomize"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={randomizeRound}
              disabled={isAnimating}
              whileTap={{ scale: 0.96 }}
              className={`flex-1 py-2.5 font-mono font-bold text-xs border-2 uppercase transition-all ${isAnimating
                ? 'border-white/20 text-white/30 cursor-not-allowed'
                : 'border-blue-400 text-blue-400 hover:bg-blue-500/10 shadow-[3px_3px_0px_#1B4FFF]'
                }`}
            >
              {isAnimating ? '⏳ Randomizing...' : `🎲 Randomize ${roundLabel(curRound, numRounds)}`}
            </motion.button>
          )}

          {allComplete && !tournament.champion && (
            <motion.button
              key="advance"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={advanceRound}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 font-display font-black text-xs border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 shadow-[3px_3px_0px_#FFE600] uppercase transition-all"
            >
              {isFinalRound ? '🏆 UMUMKAN JUARA!' : `➡️ ${roundLabel(curRound + 1, numRounds)}`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
