import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Check } from 'lucide-react'
import { useEffect, useState } from 'react'

const STEPS = [
  'Synthesizing multimodal visual telemetry...',
  'Extracting structural damage indicators...',
  'Syncing geographic coordinate layers...',
  'Retrieving hyper-local weather sensors...',
  'Executing deterministic severity calculation...',
  'Synthesizing operational action recommendations...',
]

export function AnalysisProgress({ active }: { active: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) {
      setStep(0)
      return
    }
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, STEPS.length - 1))
    }, 900)
    return () => window.clearInterval(timer)
  }, [active])

  if (!active) return null

  return (
    <div className="rounded-2xl border border-[#0071E3]/20 bg-gradient-to-b from-[#0071E3]/[0.03] to-white p-5 shadow-xs" aria-live="polite">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[#0071E3] uppercase">
        <Sparkles size={14} className="animate-spin text-[#0071E3]" style={{ animationDuration: '3s' }} />
        <span>Multimodal Reasoning In Progress</span>
      </div>

      <ul className="mt-4 space-y-2.5">
        {STEPS.map((label, index) => {
          const done = index < step
          const current = index === Math.min(step, STEPS.length - 1)
          return (
            <li
              key={label}
              className={`flex items-center gap-3 text-[13px] transition-colors ${
                done || current ? 'text-[#1D1D1F] font-medium' : 'text-[#86868B]'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  done
                    ? 'bg-[#34C759] text-white'
                    : current
                      ? 'bg-[#0071E3] text-white ring-4 ring-[#0071E3]/20'
                      : 'bg-black/[0.08] text-transparent'
                }`}
              >
                {done ? <Check size={10} strokeWidth={3} /> : null}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${label}-${current}`}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className={current ? 'text-[#0071E3]' : ''}
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
