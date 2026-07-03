import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import PostBody from '@/components/PostBody'
import type {PostBody as PostBodyValue} from '@/lib/cms'

function textBlock(
  key: string,
  text: string,
  style: 'normal' | 'h2' | 'h3' | 'h4' | 'blockquote' = 'normal',
) {
  return {
    _type: 'block' as const,
    _key: key,
    style,
    markDefs: [],
    children: [{_type: 'span' as const, _key: `${key}-s`, text, marks: []}],
  }
}

describe('PostBody', () => {
  it('renders paragraphs, headings, and blockquotes with semantic markup', () => {
    const value: PostBodyValue = [
      textBlock('p1', 'Plain paragraph.'),
      textBlock('h2', 'Section heading', 'h2'),
      textBlock('h3', 'Subsection heading', 'h3'),
      textBlock('h4', 'Minor heading', 'h4'),
      textBlock('q1', 'A memorable quote.', 'blockquote'),
    ]
    render(<PostBody value={value} />)

    expect(screen.getByText('Plain paragraph.')).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: 'Section heading'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 3, name: 'Subsection heading'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 4, name: 'Minor heading'})).toBeInTheDocument()
    expect(screen.getByText('A memorable quote.').closest('blockquote')).toBeInTheDocument()
  })

  it('renders bullet and numbered lists', () => {
    const value: PostBodyValue = [
      {...textBlock('b1', 'First bullet'), listItem: 'bullet', level: 1},
      {...textBlock('b2', 'Second bullet'), listItem: 'bullet', level: 1},
      {...textBlock('n1', 'First step'), listItem: 'number', level: 1},
    ]
    const {container} = render(<PostBody value={value} />)

    expect(container.querySelector('ul')).toBeInTheDocument()
    expect(container.querySelector('ol')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('First bullet')).toBeInTheDocument()
    expect(screen.getByText('First step')).toBeInTheDocument()
  })

  it('renders link marks with their href', () => {
    const value: PostBodyValue = [
      {
        _type: 'block',
        _key: 'l1',
        style: 'normal',
        markDefs: [{_type: 'link', _key: 'mark1', href: 'https://example.com'}],
        children: [
          {_type: 'span', _key: 'l1-s', text: 'a linked phrase', marks: ['mark1']},
        ],
      },
    ]
    render(<PostBody value={value} />)
    expect(screen.getByRole('link', {name: 'a linked phrase'})).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })

  it('renders inline images with alt text and Sanity CDN sizing params', () => {
    const value: PostBodyValue = [
      {
        _type: 'image',
        _key: 'img1',
        url: 'https://cdn.sanity.io/images/proj/prod/abc.jpg',
        alt: 'A workshop photo',
      },
    ]
    render(<PostBody value={value} />)
    const img = screen.getByRole('img', {name: 'A workshop photo'})
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(
      'https://cdn.sanity.io/images/proj/prod/abc.jpg?w=1600&auto=format',
    )
  })

  it('falls back to an empty alt for images without one', () => {
    const value: PostBodyValue = [
      {
        _type: 'image',
        _key: 'img1',
        url: 'https://cdn.sanity.io/images/proj/prod/abc.jpg',
        alt: null,
      },
    ]
    const {container} = render(<PostBody value={value} />)
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('skips image blocks without a resolved URL', () => {
    const value: PostBodyValue = [
      {_type: 'image', _key: 'img1', url: null, alt: null},
      textBlock('p1', 'Still renders text.'),
    ]
    const {container} = render(<PostBody value={value} />)
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByText('Still renders text.')).toBeInTheDocument()
  })
})
