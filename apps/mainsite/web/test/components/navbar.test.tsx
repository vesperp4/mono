import {fireEvent, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import Navbar from '@/components/Navbar'

// Navbar reads usePathname() to mark the active page — there is no app router
// context under Vitest, so mock the hook.
const {pathnameMock} = vi.hoisted(() => ({pathnameMock: vi.fn((): string => '/')}))
vi.mock('next/navigation', () => ({usePathname: pathnameMock}))

const PAGES = [
  {label: 'About', href: '/about'},
  {label: 'Team', href: '/team'},
  {label: 'Projects', href: '/projects'},
  {label: 'Events', href: '/events'},
  {label: 'Blog', href: '/blog'},
  {label: 'Contact', href: '/contact'},
] as const

beforeEach(() => {
  pathnameMock.mockReturnValue('/')
})

describe('Navbar', () => {
  it('renders all six page links with the correct hrefs', () => {
    render(<Navbar />)
    for (const page of PAGES) {
      expect(screen.getByRole('link', {name: page.label})).toHaveAttribute(
        'href',
        page.href,
      )
    }
  })

  it('links the logo back to the home page', () => {
    render(<Navbar />)
    const logo = screen.getByRole('link', {name: /vesper p4 home/i})
    expect(logo).toHaveAttribute('href', '/')
    expect(screen.getByRole('img', {name: /vesper p4 logo/i})).toBeInTheDocument()
  })

  it('marks the active page with aria-current', () => {
    pathnameMock.mockReturnValue('/blog')
    render(<Navbar />)
    expect(screen.getByRole('link', {name: 'Blog'})).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', {name: 'About'})).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('treats nested routes as active for their parent page link', () => {
    pathnameMock.mockReturnValue('/blog/some-post')
    render(<Navbar />)
    expect(screen.getByRole('link', {name: 'Blog'})).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('marks no page link active on the home page', () => {
    render(<Navbar />)
    for (const page of PAGES) {
      expect(screen.getByRole('link', {name: page.label})).not.toHaveAttribute(
        'aria-current',
      )
    }
  })

  it('opens and closes the mobile menu via the toggle button', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    const toggle = screen.getByRole('button', {name: /toggle menu/i})

    // Closed: one link per page (desktop nav only).
    expect(screen.getAllByRole('link', {name: 'About'})).toHaveLength(1)

    await user.click(toggle)
    // Open: desktop + mobile menu render a link each.
    expect(screen.getAllByRole('link', {name: 'About'})).toHaveLength(2)

    await user.click(toggle)
    expect(screen.getAllByRole('link', {name: 'About'})).toHaveLength(1)
  })

  it('switches to the solid style once the page is scrolled', () => {
    render(<Navbar />)
    const wordmark = screen.getByText('VESPER P4')
    expect(wordmark).toHaveClass('text-white')

    Object.defineProperty(window, 'scrollY', {value: 100, writable: true})
    fireEvent.scroll(window)
    expect(wordmark).toHaveClass('text-zinc-900')
  })

  it('closes the mobile menu when a menu link is clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', {name: /toggle menu/i}))

    const [, mobileLink] = screen.getAllByRole('link', {name: 'Team'})
    await user.click(mobileLink)
    expect(screen.getAllByRole('link', {name: 'Team'})).toHaveLength(1)
  })
})
