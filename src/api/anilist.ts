const ANILIST_URL = 'https://graphql.anilist.co'

const ANILIST_QUERY = `
query ($id: Int, $search: String, $type: MediaType, $page: Int, $perPage: Int, $sort: [MediaSort], $genre: String) {
  Page(page: $page, perPage: $perPage) {
    media(search: $search, type: $type, sort: $sort, genre: $genre) {
      id
      title { romaji english native }
      coverImage { large color }
      bannerImage
      description(asHtml: false)
      averageScore
      genres
      episodes
      status
      format
    }
    pageInfo { total currentPage lastPage hasNextPage }
  }
}`

const ANILIST_DETAIL_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english native }
    coverImage { large color }
    bannerImage
    description(asHtml: false)
    averageScore
    genres
    episodes
    status
    format
    nextAiringEpisode { episode airingAt }
    relations {
      edges { node { id title { romaji english } format } relationType }
    }
  }
}`

export const anilist = {
  search: async (query: string, page = 1, perPage = 20) => {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: { search: query, type: 'ANIME', page, perPage, sort: ['POPULARITY_DESC'] },
      }),
    })
    const data = await res.json()
    return data.data?.Page || null
  },

  getPopular: async (page = 1, perPage = 20) => {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: { type: 'ANIME', page, perPage, sort: ['POPULARITY_DESC'] },
      }),
    })
    const data = await res.json()
    return data.data?.Page || null
  },

  getTrending: async (page = 1, perPage = 20) => {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: { type: 'ANIME', page, perPage, sort: ['TRENDING_DESC'] },
      }),
    })
    const data = await res.json()
    return data.data?.Page || null
  },

  getTopRated: async (page = 1, perPage = 20) => {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: { type: 'ANIME', page, perPage, sort: ['SCORE_DESC'] },
      }),
    })
    const data = await res.json()
    return data.data?.Page || null
  },

  /** Popular anime filtered by genre (for the Anime browse page) */
  getByGenre: async (genre: string | null, page = 1, perPage = 24) => {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: {
          type: 'ANIME',
          page,
          perPage,
          sort: ['POPULARITY_DESC'],
          genre: genre || undefined,
        },
      }),
    })
    const data = await res.json()
    return data.data?.Page || null
  },

  getDetail: async (id: number) => {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANILIST_DETAIL_QUERY,
        variables: { id },
      }),
    })
    const data = await res.json()
    return data.data?.Media || null
  },
}
