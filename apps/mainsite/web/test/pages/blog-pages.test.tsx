import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import BlogPage, {metadata as blogMetadata} from '@/app/blog/page'
import PostPage, {
  generateMetadata,
  generateStaticParams,
} from '@/app/blog/[slug]/page'
import {getPost, getPosts, getPostSlugs, type Post, type PostSummary} from '@/lib/cms'
import {notFound} from 'next/navigation'

vi.mock('next/navigation', () => ({
  usePathname: () => '/blog',
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('@/lib/cms', () => ({
  getPosts: vi.fn(),
  getPost: vi.fn(),
  getPostSlugs: vi.fn(),
}))

const summary: PostSummary = {
  _id: 'post-1',
  title: 'Building the TV Channel',
  slug: 'building-the-tv-channel',
  publishedAt: '2026-07-01T12:00:00Z',
  author: 'Vesper Board',
  excerpt: 'How the 24/7 channel came together.',
  coverImage: {url: 'https://cdn.sanity.io/images/p/d/cover.jpg', alt: 'Studio setup'},
}

const post: Post = {
  ...summary,
  body: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 's1', text: 'It started with ffmpeg.', marks: []}],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('/blog index', () => {
  it('exports descriptive metadata', () => {
    expect(blogMetadata.title).toBe('Blog — VESPER P4')
    expect(blogMetadata.description).toBeTruthy()
  })

  it('renders published posts with date, author, cover, and post link', async () => {
    vi.mocked(getPosts).mockResolvedValue([summary])
    render(await BlogPage())

    expect(
      screen.getByRole('heading', {name: 'Building the TV Channel'}),
    ).toBeInTheDocument()
    expect(screen.getByText('July 1, 2026')).toBeInTheDocument()
    expect(screen.getByText(/vesper board/i)).toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'Studio setup'})).toBeInTheDocument()
    expect(
      screen.getByRole('link', {name: /building the tv channel/i}),
    ).toHaveAttribute('href', '/blog/building-the-tv-channel')
  })

  it('renders the empty state when there are no posts', async () => {
    vi.mocked(getPosts).mockResolvedValue([])
    render(await BlogPage())
    expect(screen.getByText('No posts yet')).toBeInTheDocument()
  })
})

describe('/blog/[slug]', () => {
  it('generates static params from published slugs', async () => {
    vi.mocked(getPostSlugs).mockResolvedValue(['first-post', 'second-post'])
    await expect(generateStaticParams()).resolves.toEqual([
      {slug: 'first-post'},
      {slug: 'second-post'},
    ])
  })

  it('renders the post header, body, and back link', async () => {
    vi.mocked(getPost).mockResolvedValue(post)
    render(await PostPage({params: Promise.resolve({slug: post.slug})}))

    expect(getPost).toHaveBeenCalledWith(post.slug)
    expect(
      screen.getByRole('heading', {level: 1, name: 'Building the TV Channel'}),
    ).toBeInTheDocument()
    expect(screen.getByText('July 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('It started with ffmpeg.')).toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'Studio setup'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /all posts/i})).toHaveAttribute(
      'href',
      '/blog',
    )
  })

  it('calls notFound() for an unknown slug', async () => {
    vi.mocked(getPost).mockResolvedValue(null)
    await expect(
      PostPage({params: Promise.resolve({slug: 'does-not-exist'})}),
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledOnce()
  })

  it('builds article metadata from the post', async () => {
    vi.mocked(getPost).mockResolvedValue(post)
    const meta = await generateMetadata({params: Promise.resolve({slug: post.slug})})
    expect(meta.title).toBe('Building the TV Channel — VESPER P4')
    expect(meta.description).toBe(post.excerpt)
    expect(meta.openGraph).toMatchObject({type: 'article', title: post.title})
  })

  it('falls back to a not-found title for unknown slugs', async () => {
    vi.mocked(getPost).mockResolvedValue(null)
    const meta = await generateMetadata({params: Promise.resolve({slug: 'nope'})})
    expect(meta.title).toBe('Post not found — VESPER P4')
  })
})
