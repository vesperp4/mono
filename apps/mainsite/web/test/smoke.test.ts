import {describe, expect, it} from 'vitest'

// Seed test so the web test pipeline has something to run. Replace with real
// component/unit tests as features land.
describe('smoke', () => {
  it('runs the test pipeline', () => {
    expect(1 + 1).toBe(2)
  })
})
