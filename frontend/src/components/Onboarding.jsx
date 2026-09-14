import { useState } from 'react'
import Modal from './Modal'
import './Onboarding.css'

const STEPS = [
  {
    title: 'Welcome to HomeValue',
    body: "A quick look at how this works, four short steps. You can skip this any time and find it again later from Settings.",
  },
  {
    title: '1. Predict',
    body: "Fill in a property's basics -- income, rooms, location -- or just describe it in plain language and we'll fill the form for you. One real trained model, not a black box.",
  },
  {
    title: '2. Understand',
    body: 'Every estimate comes with "Why this price?": the real dollar contribution of each feature, computed directly from the model, not a canned explanation.',
  },
  {
    title: '3. Compare & simulate',
    body: 'Pull up comparable properties near your prediction, or open the what-if simulator to see how changing one input moves the estimate.',
  },
  {
    title: '4. Track & decide',
    body: 'Every prediction is saved to your history. Run the investment calculator for mortgage/ROI math, then decide with real numbers behind you.',
  },
]

// Pending flag, not a "seen" flag: default-off, so only a fresh signup
// (which sets it) ever triggers the tour -- an existing account logging
// in normally, including one that predates this feature, never sees it
// retroactively just because nothing marked it "seen" yet.
const PENDING_KEY = 'hv-onboarding-pending'

export function markOnboardingPending() {
  try {
    localStorage.setItem(PENDING_KEY, '1')
  } catch {
    /* private browsing / storage disabled -- fine to just skip the tour */
  }
}

export function shouldShowOnboarding() {
  try {
    return localStorage.getItem(PENDING_KEY) === '1'
  } catch {
    return false
  }
}

function clearOnboardingPending() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* nothing to clean up if storage isn't available */
  }
}

export default function Onboarding({ open, onDone }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1

  const finish = () => {
    clearOnboardingPending()
    setStep(0)
    onDone()
  }

  const next = () => (isLast ? finish() : setStep((s) => s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  return (
    <Modal open={open} title="HomeValue walkthrough" onClose={finish}>
      <div className="onboarding">
        <p className="onboarding__eyebrow hv-label">
          Step {step + 1} of {STEPS.length}
        </p>
        <h3 className="onboarding__title">{STEPS[step].title}</h3>
        <p className="onboarding__body">{STEPS[step].body}</p>

        <div className="onboarding__dots" role="tablist" aria-label="Walkthrough progress">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === step}
              aria-label={`Step ${i + 1}: ${s.title}`}
              className={`onboarding__dot ${i === step ? 'is-active' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <div className="onboarding__actions">
          <button type="button" className="hv-btn hv-btn-ghost" onClick={finish}>
            Skip
          </button>
          <div className="onboarding__nav">
            {step > 0 && (
              <button type="button" className="hv-btn hv-btn-secondary" onClick={back}>
                Back
              </button>
            )}
            <button type="button" className="hv-btn hv-btn-primary" onClick={next}>
              {isLast ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
