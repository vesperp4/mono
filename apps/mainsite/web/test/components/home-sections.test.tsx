import {render, screen, fireEvent} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import About from '@/components/About'
import LeadershipSection from '@/components/LeadershipSection'
import MetricsStrip from '@/components/MetricsStrip'
import MissionVision from '@/components/MissionVision'
import ObjectivesList from '@/components/ObjectivesList'
import {LEADERSHIP, OBJECTIVES} from '@/lib/media'

describe('About', () => {
  it('renders the section title and editorial copy', () => {
    render(<About />)
    expect(screen.getByRole('heading', {name: 'Why VESPER?'})).toBeInTheDocument()
    expect(
      screen.getByText(/unified space across cybersecurity, artificial intelligence/i),
    ).toBeInTheDocument()
  })

  it('renders the four value tags', () => {
    render(<About />)
    for (const tag of [
      'Collaboration',
      'Applied Learning',
      'Career Development',
      'Interdisciplinary',
    ]) {
      expect(screen.getByText(tag)).toBeInTheDocument()
    }
  })
})

describe('MetricsStrip', () => {
  it('renders every metric value with its label', () => {
    render(<MetricsStrip />)
    for (const label of ['Pillars', 'Founders', 'Mission', 'PUPR Community']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getAllByText('4')).toHaveLength(2)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('ECECS')).toBeInTheDocument()
  })
})

describe('MissionVision', () => {
  it('renders the mission and vision statements', () => {
    render(<MissionVision />)
    expect(screen.getByText('Mission')).toBeInTheDocument()
    expect(screen.getByText('Vision')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {name: 'Advancing knowledge. Building community.'}),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {name: 'Structured. Inclusive. Driven.'}),
    ).toBeInTheDocument()
    expect(screen.getByText(/cultivate a collaborative academic community/i)).toBeInTheDocument()
    expect(screen.getByText(/structured yet inclusive environment/i)).toBeInTheDocument()
  })
})

describe('ObjectivesList', () => {
  it('renders all objectives with zero-padded indices', () => {
    render(<ObjectivesList />)
    for (const objective of OBJECTIVES) {
      expect(screen.getByText(objective)).toBeInTheDocument()
    }
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText(String(OBJECTIVES.length).padStart(2, '0'))).toBeInTheDocument()
  })

  it('highlights an objective on hover and resets on leave', () => {
    render(<ObjectivesList />)
    const first = screen.getByText(OBJECTIVES[0])
    fireEvent.mouseEnter(first.parentElement as HTMLElement)
    expect(first).toHaveClass('text-zinc-900')
    fireEvent.mouseLeave(first.parentElement as HTMLElement)
    expect(first).toHaveClass('text-zinc-500')
  })
})

describe('LeadershipSection', () => {
  it('renders every board member with their role', () => {
    render(<LeadershipSection />)
    for (const member of LEADERSHIP) {
      expect(screen.getByRole('heading', {name: member.name})).toBeInTheDocument()
      expect(screen.getByText(member.role)).toBeInTheDocument()
    }
    expect(
      screen.getByText(/polytechnic university of puerto rico · ececs department/i),
    ).toBeInTheDocument()
  })
})
