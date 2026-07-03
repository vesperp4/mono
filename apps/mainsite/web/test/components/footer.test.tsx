import {render, screen, fireEvent, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import Footer from '@/components/Footer'
import {CHAPTER_EMAIL, PORTAL_SIGNUP_URL, SOCIAL_LINKS} from '@/lib/site'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Footer', () => {
  it('renders the Pages link group including the external Join link', () => {
    render(<Footer />)
    const pages = within(screen.getByRole('navigation', {name: 'Pages'}))
    for (const [label, href] of [
      ['About', '/about'],
      ['Team', '/team'],
      ['Projects', '/projects'],
      ['Events', '/events'],
      ['Blog', '/blog'],
      ['Contact', '/contact'],
    ]) {
      expect(pages.getByRole('link', {name: label})).toHaveAttribute('href', href)
    }
    expect(pages.getByRole('link', {name: 'Join'})).toHaveAttribute(
      'href',
      PORTAL_SIGNUP_URL,
    )
  })

  it('renders the home-page anchor link group', () => {
    render(<Footer />)
    const home = within(screen.getByRole('navigation', {name: 'On the home page'}))
    for (const [label, href] of [
      ['About', '/#about'],
      ['Pillars', '/#pillars'],
      ['Founders', '/#stars'],
      ['Mission', '/#mission'],
      ['Leadership', '/#leadership'],
    ]) {
      expect(home.getByRole('link', {name: label})).toHaveAttribute('href', href)
    }
  })

  it('renders the chapter email as a mailto link', () => {
    render(<Footer />)
    expect(screen.getByRole('link', {name: CHAPTER_EMAIL})).toHaveAttribute(
      'href',
      `mailto:${CHAPTER_EMAIL}`,
    )
  })

  it('renders a labeled link for every social profile', () => {
    render(<Footer />)
    for (const social of SOCIAL_LINKS) {
      expect(screen.getByRole('link', {name: social.label})).toBeInTheDocument()
    }
  })

  it('thickens the magnetic wordmark letters on mouse proximity and resets on leave', () => {
    // Run rAF callbacks synchronously so the mousemove handler applies weights
    // in the same tick.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
    render(<Footer />)

    const wordmark = screen.getByLabelText('VESPER P4')
    const firstLetter = wordmark.querySelector('span') as HTMLSpanElement
    expect(firstLetter).toHaveStyle({fontWeight: '400'})

    // jsdom rects are all-zero, so distance to the cursor at (0,0) is 0 —
    // maximum proximity, maximum weight.
    fireEvent.mouseMove(wordmark, {clientX: 0, clientY: 0})
    expect(firstLetter).toHaveStyle({fontWeight: '700'})

    // mouseLeave fires on the zone that owns the handler (it does not bubble).
    const zone = wordmark.parentElement?.parentElement as HTMLElement
    fireEvent.mouseLeave(zone)
    expect(firstLetter).toHaveStyle({fontWeight: '400'})
  })
})
