import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateAuthUrl } from '../utils/lastfmAuth.js'

const STEPS = [
  {
    title: 'Create a Last.fm account',
    description: 'Last.fm is a free service that tracks your music across Spotify, Apple Music, and more.',
    action: 'Open Last.fm',
    url: 'https://www.last.fm/join',
    note: 'Already have one? Skip to step 3',
  },
  {
    title: 'Connect your music service',
    description: 'Link your Spotify, Apple Music, or other service so Last.fm can see what you listen to.',
    action: 'Open Last.fm settings',
    url: 'https://www.last.fm/settings/applications',
    note: 'This is a one-time setup — takes 30 seconds',
  },
  {
    title: 'Connect to My Music Memory',
    description: 'You\'re all set! Click below to authorize and start exploring your music data.',
    action: 'Connect Last.fm',
    url: null,
    note: null,
  },
]

export default function LastfmOnboarding({ onBack }) {
  const [step, setStep] = useState(0)

  function handleAction() {
    if (step < 2) {
      window.open(STEPS[step].url, '_blank')
    } else {
      window.location.href = generateAuthUrl()
    }
  }

  function handleSkipToConnect() {
    setStep(2)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex items-center justify-center bg-bg-primary"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 10% 80%, rgba(61,120,80,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 90% 10%, rgba(61,120,80,0.05) 0%, transparent 55%),
          rgb(26, 24, 21)
        `,
      }}
    >
      <div className="max-w-sm w-full px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-mono text-xs text-accent/60 uppercase tracking-widest mb-3">
            /// SETUP
          </p>
          <h1 className="text-2xl text-text-primary mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Connect Last.fm
          </h1>
          <p className="text-sm text-text-secondary">
            3 quick steps to unlock your music data
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-8 bg-accent' :
                i < step ? 'w-4 bg-accent/50' :
                'w-4 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-surface border border-border rounded-lg p-6 mb-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-7 h-7 rounded-full bg-accent/20 text-accent-light flex items-center justify-center text-sm font-mono flex-shrink-0">
                {step + 1}
              </span>
              <div>
                <h2 className="text-text-primary text-sm font-medium">{STEPS[step].title}</h2>
                <p className="text-text-muted text-xs mt-1 leading-relaxed">{STEPS[step].description}</p>
              </div>
            </div>

            <button
              onClick={handleAction}
              className="w-full py-2.5 bg-accent/10 hover:bg-accent/20 text-accent-light border border-accent/40 font-mono text-xs uppercase tracking-widest transition-all"
            >
              [ {STEPS[step].action} ] →
            </button>

            {STEPS[step].note && (
              <p className="text-[10px] text-text-muted text-center mt-3">
                {step === 0 ? (
                  <button onClick={handleSkipToConnect} className="hover:text-accent-light transition-colors underline">
                    {STEPS[step].note}
                  </button>
                ) : (
                  STEPS[step].note
                )}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={step > 0 ? () => setStep(step - 1) : onBack}
            className="text-text-muted hover:text-text-secondary text-xs transition-colors"
          >
            ← {step > 0 ? 'Previous' : 'Back'}
          </button>

          {step < 2 && (
            <button
              onClick={() => setStep(step + 1)}
              className="text-accent-light hover:text-accent text-xs transition-colors"
            >
              I've done this, next →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
