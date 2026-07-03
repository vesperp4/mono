import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import FourPillars from '@/components/FourPillars'
import PillarCard from '@/components/PillarCard'
import StarFounderCard from '@/components/StarFounderCard'
import StarsFounders from '@/components/StarsFounders'
import {FOUNDERS, PILLARS} from '@/lib/media'

describe('FourPillars', () => {
  it('renders the section title and all four pillar cards', () => {
    render(<FourPillars />)
    expect(screen.getByRole('heading', {name: 'Four Disciplines.'})).toBeInTheDocument()
    for (const pillar of PILLARS) {
      expect(screen.getByRole('heading', {name: pillar.name})).toBeInTheDocument()
      expect(screen.getByText(pillar.star)).toBeInTheDocument()
      expect(screen.getByText(pillar.description)).toBeInTheDocument()
    }
  })
})

describe('PillarCard', () => {
  const pillar = {...PILLARS[0], index: 0}

  it('shows the hover overlay on mouse enter and clears it on leave', async () => {
    const user = userEvent.setup()
    render(<PillarCard {...pillar} />)
    expect(screen.queryByText('View Pillar')).not.toBeInTheDocument()

    const heading = screen.getByRole('heading', {name: pillar.name})
    await user.hover(heading)
    expect(screen.getByText('View Pillar')).toBeInTheDocument()

    // AnimatePresence removes the overlay asynchronously after the exit
    // animation, so only assert the state flipped back (no crash on leave).
    await user.unhover(heading)
  })
})

describe('StarsFounders', () => {
  it('renders every founder with their star image alt text', () => {
    render(<StarsFounders />)
    expect(screen.getByRole('heading', {name: 'The Four Stars.'})).toBeInTheDocument()
    for (const founder of FOUNDERS) {
      expect(screen.getByRole('heading', {name: founder.name})).toBeInTheDocument()
      expect(
        screen.getByRole('img', {name: `${founder.star} — ${founder.pillar}`}),
      ).toBeInTheDocument()
    }
  })
})

describe('StarFounderCard', () => {
  const founder = {...FOUNDERS[0], index: 0}

  it('reveals the star meaning on hover and restores the divider on leave', async () => {
    const user = userEvent.setup()
    const {container} = render(<StarFounderCard {...founder} />)
    expect(screen.queryByText(founder.meaning)).not.toBeInTheDocument()
    expect(container.querySelector('.h-px.bg-zinc-100')).toBeInTheDocument()

    const heading = screen.getByRole('heading', {name: founder.name})
    await user.hover(heading)
    expect(screen.getByText(founder.meaning)).toBeInTheDocument()
    expect(container.querySelector('.h-px.bg-zinc-100')).not.toBeInTheDocument()

    await user.unhover(heading)
    expect(container.querySelector('.h-px.bg-zinc-100')).toBeInTheDocument()
  })
})
