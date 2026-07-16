import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { VizButton } from './vizUtils'

/**
 * Chains of Consequence. Choose a first cause and walk its effects forward
 * — including the unintended ones — then step back through the chain.
 * Every path here is illustrative, not predictive.
 */
const TREES = {
  email: {
    label: 'Write the difficult email',
    root: {
      text: 'You finally write the difficult email.',
      children: [
        {
          text: 'The issue is out in the open.', intended: true,
          children: [
            { text: 'A hard but honest meeting follows.', intended: true, children: [] },
            { text: 'A colleague you didn\'t address feels implicated.', intended: false, children: [] },
          ],
        },
        {
          text: 'You sleep better, having stopped rehearsing it.', intended: false,
          children: [
            { text: 'The energy freed goes into actual work.', intended: false, children: [] },
          ],
        },
      ],
    },
  },
  practice: {
    label: 'Skip practice for a week',
    root: {
      text: 'You skip practice for a week.',
      children: [
        {
          text: 'The week feels roomier.', intended: true,
          children: [
            { text: 'Restarting costs more than the week saved.', intended: false, children: [] },
          ],
        },
        {
          text: 'The habit\'s automaticity weakens.', intended: false,
          children: [
            { text: 'Skipping becomes easier to justify next time.', intended: false, children: [] },
            { text: 'You notice how the skill actually matters to you.', intended: false, children: [] },
          ],
        },
      ],
    },
  },
  garden: {
    label: 'Plant a small garden',
    root: {
      text: 'You plant a small garden.',
      children: [
        {
          text: 'Some of it grows.', intended: true,
          children: [
            { text: 'You eat something you made from nothing.', intended: true, children: [] },
          ],
        },
        {
          text: 'You start noticing weather, soil, seasons.', intended: false,
          children: [
            { text: 'A daily ten-minute ritual forms by itself.', intended: false, children: [] },
          ],
        },
      ],
    },
  },
}

export function CausationViz({ accentHex = '#a98763' }) {
  const [treeKey, setTreeKey] = useState('email')
  const [path, setPath] = useState([]) // indices walked from the root

  const tree = TREES[treeKey]
  let node = tree.root
  const walked = [node]
  for (const index of path) {
    node = node.children[index]
    walked.push(node)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="First action">
        {Object.entries(TREES).map(([key, entry]) => (
          <VizButton key={key} active={key === treeKey} onClick={() => { setTreeKey(key); setPath([]) }}>
            {entry.label}
          </VizButton>
        ))}
      </div>

      {/* The chain walked so far */}
      <ol className="mt-6 space-y-0">
        {walked.map((step, index) => (
          <li key={index} className="relative pl-6 pb-4">
            {index < walked.length - 1 && (
              <span className="absolute left-[7px] top-5 bottom-0 w-px" style={{ background: `${accentHex}55` }} aria-hidden="true" />
            )}
            <span
              className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border"
              style={{ borderColor: accentHex, background: index === walked.length - 1 ? `${accentHex}33` : 'transparent' }}
              aria-hidden="true"
            />
            <p className="font-serif text-[0.9375rem] text-parchment-100 leading-relaxed">
              {step.text}
              {index > 0 && (
                <span className={`ml-2 font-sans text-[0.625rem] tracking-caps uppercase ${step.intended ? 'text-gold-400' : 'text-violet-300'}`}>
                  {step.intended ? 'intended' : 'unintended'}
                </span>
              )}
            </p>
          </li>
        ))}
      </ol>

      {/* Next effects to explore */}
      {node.children.length > 0 ? (
        <div className="mt-2 pl-6 space-y-2">
          <p className="caps-label text-parchment-500">…and then</p>
          {node.children.map((child, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPath([...path, index])}
              className="block w-full text-left border border-ink-500 hover:border-gold-600 rounded-sm px-4 py-2.5 font-serif text-sm text-parchment-300 hover:text-parchment-100 transition-colors"
            >
              {child.text}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 pl-6 font-sans text-xs text-parchment-500">
          The chain continues past what any diagram can draw — which is rather the point.
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPath(path.slice(0, -1))}
          disabled={path.length === 0}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-parchment-400 hover:text-parchment-200 disabled:opacity-30"
        >
          <ArrowLeft size={12} aria-hidden="true" /> Step back through the chain
        </button>
        <span className="font-sans text-[0.6875rem] text-parchment-500">Illustrative, not predictive</span>
      </div>
    </div>
  )
}
