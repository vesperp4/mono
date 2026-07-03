import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import Home from '@/app/page'

vi.mock('next/navigation', () => ({usePathname: () => '/'}))

describe('Home page', () => {
  it('composes every home section from hero to footer', () => {
    render(<Home />)

    // Hero
    expect(screen.getByRole('heading', {name: 'VESPER'})).toBeInTheDocument()
    // About
    expect(screen.getByRole('heading', {name: 'Why VESPER?'})).toBeInTheDocument()
    // Pillars + Founders
    expect(screen.getByRole('heading', {name: 'Four Disciplines.'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'The Four Stars.'})).toBeInTheDocument()
    // Mission / Objectives / Leadership
    expect(
      screen.getByRole('heading', {name: 'Advancing knowledge. Building community.'}),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'What We Do.'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'The Board.'})).toBeInTheDocument()
    // Navbar + Footer chrome
    expect(screen.getByRole('link', {name: /vesper p4 home/i})).toBeInTheDocument()
    expect(screen.getByRole('navigation', {name: 'Pages'})).toBeInTheDocument()
  })
})
