import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import AboutPage, {metadata as aboutMetadata} from '@/app/about/page'
import ContactPage, {metadata as contactMetadata} from '@/app/contact/page'
import ProjectsPage, {metadata as projectsMetadata} from '@/app/projects/page'
import {CHAPTER_EMAIL, PORTAL_SIGNUP_URL} from '@/lib/site'
import {PILLARS} from '@/lib/media'

vi.mock('next/navigation', () => ({usePathname: () => '/about'}))

describe('/about', () => {
  it('exports descriptive metadata', () => {
    expect(aboutMetadata.title).toBe('About — VESPER P4')
    expect(aboutMetadata.description).toBeTruthy()
  })

  it('renders the page header and the four pillars in depth', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', {name: 'The Association.'})).toBeInTheDocument()
    for (const pillar of PILLARS) {
      expect(screen.getByRole('heading', {name: pillar.name})).toBeInTheDocument()
    }
    // Reused home sections come along.
    expect(screen.getByRole('heading', {name: 'Why VESPER?'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'What We Do.'})).toBeInTheDocument()
  })
})

describe('/projects', () => {
  it('exports descriptive metadata', () => {
    expect(projectsMetadata.title).toBe('Projects — VESPER P4')
    expect(projectsMetadata.description).toBeTruthy()
  })

  it('renders every flagship project with its outbound link', () => {
    render(<ProjectsPage />)
    for (const [name, url] of [
      ['Main Site', 'https://vesperp4.com'],
      ['Member Portal', 'https://portal.vesperp4.com'],
      ['VesperP4 TV', 'https://dev.vesperp4.tv'],
    ] as const) {
      expect(screen.getByRole('heading', {name})).toBeInTheDocument()
      expect(screen.getByRole('link', {name: new RegExp(`visit ${url.replace('https://', '')}`, 'i')})).toHaveAttribute('href', url)
    }
    expect(screen.getByText('More on the way')).toBeInTheDocument()
  })
})

describe('/contact', () => {
  it('exports descriptive metadata', () => {
    expect(contactMetadata.title).toBe('Contact — VESPER P4')
    expect(contactMetadata.description).toBeTruthy()
  })

  it('renders the chapter email as the primary mailto link', () => {
    render(<ContactPage />)
    // The email appears in the contact body and again in the footer.
    const emailLinks = screen.getAllByRole('link', {name: CHAPTER_EMAIL})
    expect(emailLinks.length).toBeGreaterThan(0)
    for (const link of emailLinks) {
      expect(link).toHaveAttribute('href', `mailto:${CHAPTER_EMAIL}`)
    }
  })

  it('links the Join CTA to the portal signup', () => {
    render(<ContactPage />)
    expect(
      screen.getByRole('link', {name: /apply on the portal/i}),
    ).toHaveAttribute('href', PORTAL_SIGNUP_URL)
  })

  it('lists the social profiles with accessible labels', () => {
    render(<ContactPage />)
    for (const label of ['LinkedIn', 'GitHub', 'Discord']) {
      // One in the contact body, one in the footer.
      expect(screen.getAllByRole('link', {name: label}).length).toBeGreaterThan(0)
    }
  })
})
