import {describe, expect, it} from 'vitest'

import {formatDate, formatDateTime, formatEventRange} from '../lib/dates'

// All formatters are pinned to America/Puerto_Rico (UTC-4, no DST) with a
// fixed locale so output is identical at build time and in the browser.
describe('dates', () => {
  it('formats a date in Puerto Rico time', () => {
    // 2026-07-03T02:00Z is still July 2nd in AST (UTC-4)
    expect(formatDate('2026-07-03T02:00:00Z')).toBe('July 2, 2026')
  })

  it('formats a full timestamp', () => {
    expect(formatDateTime('2026-07-02T22:00:00Z')).toBe('Thu, Jul 2, 2026, 6:00 PM')
  })

  it('collapses same-day event ranges to an end time', () => {
    expect(formatEventRange('2026-07-02T22:00:00Z', '2026-07-03T00:00:00Z')).toBe(
      'Thu, Jul 2, 2026, 6:00 PM – 8:00 PM'
    )
  })

  it('spells out multi-day event ranges', () => {
    expect(formatEventRange('2026-07-02T22:00:00Z', '2026-07-03T14:00:00Z')).toBe(
      'Thu, Jul 2, 2026, 6:00 PM – Fri, Jul 3, 2026, 10:00 AM'
    )
  })

  it('renders start only when there is no end', () => {
    expect(formatEventRange('2026-07-02T22:00:00Z', null)).toBe('Thu, Jul 2, 2026, 6:00 PM')
  })
})
