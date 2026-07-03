import {act, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import ConvexClientProvider from '@/app/providers'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import RevealText from '@/components/RevealText'
import ScrambleText from '@/components/ScrambleText'
import SectionTitle from '@/components/SectionTitle'
import {SocialIcon} from '@/components/SocialIcons'
import VideoBlock from '@/components/VideoBlock'
import {FallingPattern} from '@/components/ui/falling-pattern'

describe('SectionTitle', () => {
  it('renders the eyebrow and title as a heading', () => {
    render(<SectionTitle eyebrow="About" title="Why VESPER?" />)
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Why VESPER?'})).toBeInTheDocument()
  })

  it('omits the eyebrow when not provided', () => {
    render(<SectionTitle title="Standalone." />)
    expect(screen.getByRole('heading', {name: 'Standalone.'})).toBeInTheDocument()
  })

  it('supports the light and screenBlend variants', () => {
    const {rerender} = render(<SectionTitle title="Variant." light />)
    expect(screen.getByRole('heading', {name: 'Variant.'})).toHaveClass('text-white')
    rerender(<SectionTitle title="Variant." screenBlend />)
    expect(screen.getByRole('heading', {name: 'Variant.'})).toHaveStyle({
      mixBlendMode: 'screen',
    })
  })
})

describe('EmptyState', () => {
  it('renders the title and message', () => {
    render(<EmptyState title="No posts yet" message="Check back soon." />)
    expect(screen.getByText('No posts yet')).toBeInTheDocument()
    expect(screen.getByText('Check back soon.')).toBeInTheDocument()
  })
})

describe('PageHeader', () => {
  it('renders eyebrow, title, and description', () => {
    render(<PageHeader eyebrow="Journal" title="Blog." description="Field notes." />)
    expect(screen.getByText('Journal')).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Blog.'})).toBeInTheDocument()
    expect(screen.getByText('Field notes.')).toBeInTheDocument()
  })

  it('omits the description block when not provided', () => {
    render(<PageHeader eyebrow="Contact" title="Get in Touch." />)
    expect(screen.getByRole('heading', {name: 'Get in Touch.'})).toBeInTheDocument()
  })
})

describe('SocialIcon', () => {
  it.each(['LinkedIn', 'GitHub', 'Discord'] as const)(
    'renders a decorative %s glyph',
    (label) => {
      const {container} = render(<SocialIcon label={label} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Icons are decorative — the accessible name comes from the link around them.
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    },
  )
})

describe('ScrambleText', () => {
  it('renders the final text with a stable aria-label', () => {
    render(<ScrambleText text="Four Disciplines." />)
    const el = screen.getByLabelText('Four Disciplines.')
    expect(el).toHaveTextContent('Four Disciplines.')
  })

  it('settles back on the exact text after the scramble animation', () => {
    // Swap in an IntersectionObserver that reports "in view" immediately so
    // the scramble effect actually runs, then drive it with fake timers.
    const OriginalIO = globalThis.IntersectionObserver
    class FiringIO implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly thresholds: readonly number[] = []
      constructor(private readonly cb: IntersectionObserverCallback) {}
      observe(target: Element): void {
        this.cb(
          [{isIntersecting: true, target} as IntersectionObserverEntry],
          this,
        )
      }
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return []
      }
    }
    globalThis.IntersectionObserver = FiringIO as unknown as typeof IntersectionObserver
    vi.useFakeTimers({
      toFake: ['Date', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'],
    })

    try {
      render(<ScrambleText text="Vigilance" />)
      // The animation distributes the reveal across 800ms of rAF frames.
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(screen.getByLabelText('Vigilance')).toHaveTextContent('Vigilance')
    } finally {
      vi.useRealTimers()
      globalThis.IntersectionObserver = OriginalIO
    }
  })
})

describe('RevealText', () => {
  it('renders its children', () => {
    render(
      <RevealText>
        <p>Hidden until in view</p>
      </RevealText>,
    )
    expect(screen.getByText('Hidden until in view')).toBeInTheDocument()
  })
})

describe('VideoBlock', () => {
  it('renders a muted looping video with the given source', () => {
    const {container} = render(<VideoBlock src="/cover.mp4" overlay />)
    const video = container.querySelector('video')
    expect(video).toHaveAttribute('src', '/cover.mp4')
    expect(video).toHaveAttribute('loop')
    expect(video).toHaveAttribute('playsinline')
  })
})

describe('FallingPattern', () => {
  it('smoke-renders the decorative pattern', () => {
    const {container} = render(<FallingPattern color="#fff" backgroundColor="#000" />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('ConvexClientProvider', () => {
  it('passes children through', () => {
    render(
      <ConvexClientProvider>
        <span>child content</span>
      </ConvexClientProvider>,
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })
})
