import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS, useReaderStore } from './readerStore'

describe('readerStore', () => {
  beforeEach(() => {
    useReaderStore.getState().resetSettings()
  })

  it('starts with the shared defaults', () => {
    expect(useReaderStore.getState().settings).toEqual(DEFAULT_SETTINGS)
  })

  it('updates a single setting', () => {
    useReaderStore.getState().setSetting('theme', 'parchment')
    expect(useReaderStore.getState().settings.theme).toBe('parchment')
    expect(useReaderStore.getState().settings.mode).toBe(DEFAULT_SETTINGS.mode)
  })

  it('resets to defaults', () => {
    useReaderStore.getState().setSetting('fontScale', 1.3)
    useReaderStore.getState().resetSettings()
    expect(useReaderStore.getState().settings.fontScale).toBe(1.0)
  })
})
