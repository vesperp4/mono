import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import TeamPage, {metadata} from '@/app/team/page'
import {getTeamMembers, type TeamMember} from '@/lib/cms'

vi.mock('next/navigation', () => ({usePathname: () => '/team'}))

vi.mock('@/lib/cms', () => ({
  getTeamMembers: vi.fn(),
}))

const withPhoto: TeamMember = {
  _id: 'tm-1',
  name: 'Jane Q. Member',
  role: 'Cyber Pillar Lead',
  order: 1,
  photo: {url: 'https://cdn.sanity.io/images/p/d/jane.jpg', alt: 'Jane portrait'},
  linkedinUrl: 'https://linkedin.com/in/jane',
  githubUrl: 'https://github.com/jane',
}

const withoutPhoto: TeamMember = {
  _id: 'tm-2',
  name: 'Pedro Sin Foto',
  role: 'Member',
  order: 2,
  photo: null,
  linkedinUrl: null,
  githubUrl: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('/team', () => {
  it('exports descriptive metadata', () => {
    expect(metadata.title).toBe('Team — VESPER P4')
    expect(metadata.description).toBeTruthy()
  })

  it('renders roster members with photos and labeled social links', async () => {
    vi.mocked(getTeamMembers).mockResolvedValue([withPhoto])
    render(await TeamPage())

    expect(screen.getByRole('heading', {name: 'Jane Q. Member'})).toBeInTheDocument()
    expect(screen.getByText('Cyber Pillar Lead')).toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'Jane portrait'})).toBeInTheDocument()
    expect(
      screen.getByRole('link', {name: 'Jane Q. Member on LinkedIn'}),
    ).toHaveAttribute('href', withPhoto.linkedinUrl)
    expect(
      screen.getByRole('link', {name: 'Jane Q. Member on GitHub'}),
    ).toHaveAttribute('href', withPhoto.githubUrl)
  })

  it('falls back to initials when a member has no photo', async () => {
    vi.mocked(getTeamMembers).mockResolvedValue([withoutPhoto])
    render(await TeamPage())

    expect(screen.getByRole('heading', {name: 'Pedro Sin Foto'})).toBeInTheDocument()
    expect(screen.getByText('PS')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {name: /pedro sin foto on/i}),
    ).not.toBeInTheDocument()
  })

  it('renders the empty roster state plus founders and board sections', async () => {
    vi.mocked(getTeamMembers).mockResolvedValue([])
    render(await TeamPage())

    expect(screen.getByText('Roster coming soon')).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'The Four Stars.'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'The Board.'})).toBeInTheDocument()
  })
})
