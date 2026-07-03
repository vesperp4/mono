import {afterEach, describe, expect, it, vi} from 'vitest'

// lib/cms reads NEXT_PUBLIC_SANITY_PROJECT_ID at module scope, so each test
// stubs the env first and re-imports a fresh copy of the module.
async function loadCms(projectId: string) {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', projectId)
  return await import('../lib/cms')
}

function okResponse(result: unknown) {
  return {ok: true, json: async () => ({result})} as Response
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('cms', () => {
  it('returns empty results without fetching when unconfigured', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const cms = await loadCms('')

    expect(await cms.getPosts()).toEqual([])
    expect(await cms.getPost('some-post')).toBeNull()
    expect(await cms.getPostSlugs()).toEqual([])
    expect(await cms.getUpcomingEvents()).toEqual([])
    expect(await cms.getPastEvents()).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the GROQ result on a successful query', async () => {
    const posts = [
      {
        _id: 'a',
        title: 'Hello',
        slug: 'hello',
        publishedAt: '2026-07-01T12:00:00Z',
        author: 'Vesper',
        excerpt: 'First post',
        coverImage: null,
      },
    ]
    const fetchMock = vi.fn().mockResolvedValue(okResponse(posts))
    vi.stubGlobal('fetch', fetchMock)
    const cms = await loadCms('testproj')

    expect(await cms.getPosts()).toEqual(posts)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.origin).toBe('https://testproj.api.sanity.io')
    expect(url.pathname).toBe('/v2024-01-01/data/query/production')
    expect(url.searchParams.get('query')).toContain('_type == "post"')
  })

  it('passes the slug as a GROQ parameter to getPost', async () => {
    const post = {_id: 'a', title: 'Hello', slug: 'hello', body: []}
    const fetchMock = vi.fn().mockResolvedValue(okResponse(post))
    vi.stubGlobal('fetch', fetchMock)
    const cms = await loadCms('testproj')

    expect(await cms.getPost('hello')).toEqual(post)
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.searchParams.get('$slug')).toBe('"hello"')
  })

  it('returns empty results on a non-OK response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ok: false} as Response)
    vi.stubGlobal('fetch', fetchMock)
    const cms = await loadCms('testproj')

    expect(await cms.getPosts()).toEqual([])
    expect(await cms.getPost('hello')).toBeNull()
    expect(await cms.getUpcomingEvents()).toEqual([])
    expect(fetchMock).toHaveBeenCalled()
  })

  it('returns empty results when fetch rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    const cms = await loadCms('testproj')

    expect(await cms.getPosts()).toEqual([])
    expect(await cms.getPastEvents()).toEqual([])
  })
})
