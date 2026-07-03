import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import Hero from '@/components/Hero'
import {PORTAL_SIGNUP_URL} from '@/lib/site'

describe('Hero', () => {
  it('renders the VESPER P4 title and tagline', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', {name: 'VESPER'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'P4'})).toBeInTheDocument()
    expect(
      screen.getByText(/one mission\. four stars\. integrated vigilance\./i),
    ).toBeInTheDocument()
  })

  it('links the Join Us CTA to the portal signup', () => {
    render(<Hero />)
    expect(screen.getByRole('link', {name: /join us/i})).toHaveAttribute(
      'href',
      PORTAL_SIGNUP_URL,
    )
  })

  it('scrolls to the pillars section when Explore Pillars is clicked', async () => {
    const user = userEvent.setup()
    render(<Hero />)

    // The #pillars section lives outside the Hero on the real page.
    const target = document.createElement('div')
    target.id = 'pillars'
    document.body.appendChild(target)
    const scrollSpy = vi
      .spyOn(target, 'scrollIntoView')
      .mockImplementation(() => {})

    await user.click(screen.getByRole('button', {name: /explore pillars/i}))
    expect(scrollSpy).toHaveBeenCalledWith({behavior: 'smooth'})
    target.remove()
  })
})
