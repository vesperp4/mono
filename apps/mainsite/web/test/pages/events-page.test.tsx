import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import EventsPage, {metadata} from '@/app/events/page'
import {getPastEvents, getUpcomingEvents, type CmsEvent} from '@/lib/cms'

vi.mock('next/navigation', () => ({usePathname: () => '/events'}))

vi.mock('@/lib/cms', () => ({
  getUpcomingEvents: vi.fn(),
  getPastEvents: vi.fn(),
}))

const upcomingEvent: CmsEvent = {
  _id: 'evt-1',
  title: 'Intro to Threat Hunting',
  start: '2026-08-12T22:00:00Z',
  end: '2026-08-13T00:00:00Z',
  location: 'PUPR Main Campus',
  description: 'Hands-on workshop across the cyber pillar.',
  rsvpUrl: 'https://example.com/rsvp',
  image: {url: 'https://cdn.sanity.io/images/p/d/event.jpg', alt: 'Workshop room'},
}

const pastEvent: CmsEvent = {
  _id: 'evt-0',
  title: 'Kickoff Assembly',
  start: '2026-02-10T23:00:00Z',
  end: null,
  location: 'Auditorium',
  description: 'The founding assembly.',
  rsvpUrl: null,
  image: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('/events', () => {
  it('exports descriptive metadata', () => {
    expect(metadata.title).toBe('Events — VESPER P4')
    expect(metadata.description).toBeTruthy()
  })

  it('renders upcoming events with time range, image, and RSVP link', async () => {
    vi.mocked(getUpcomingEvents).mockResolvedValue([upcomingEvent])
    vi.mocked(getPastEvents).mockResolvedValue([])
    render(await EventsPage())

    expect(
      screen.getByRole('heading', {name: 'Intro to Threat Hunting'}),
    ).toBeInTheDocument()
    expect(screen.getByText('PUPR Main Campus')).toBeInTheDocument()
    // Same-day event collapses to a "start – end time" range (America/Puerto_Rico).
    expect(screen.getByText(/6:00 PM – 8:00 PM/)).toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'Workshop room'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'RSVP'})).toHaveAttribute(
      'href',
      upcomingEvent.rsvpUrl,
    )
    expect(screen.getByText('No past events yet.')).toBeInTheDocument()
  })

  it('renders past events in the compact list', async () => {
    vi.mocked(getUpcomingEvents).mockResolvedValue([])
    vi.mocked(getPastEvents).mockResolvedValue([pastEvent])
    render(await EventsPage())

    expect(screen.getByText('Kickoff Assembly')).toBeInTheDocument()
    expect(screen.getByText('Auditorium')).toBeInTheDocument()
    expect(screen.getByText('Nothing scheduled yet')).toBeInTheDocument()
  })

  it('renders both empty states when the calendar is empty', async () => {
    vi.mocked(getUpcomingEvents).mockResolvedValue([])
    vi.mocked(getPastEvents).mockResolvedValue([])
    render(await EventsPage())

    expect(screen.getByText('Nothing scheduled yet')).toBeInTheDocument()
    expect(screen.getByText('No past events yet.')).toBeInTheDocument()
  })
})
