import animeJson from '../../public/data/anime.json'
import mangaJson from '../../public/data/manga.json'

export const OFFLINE_ANIME = (animeJson as any).anime || []
export const OFFLINE_MANGA = (mangaJson as any).manga || []

export const OFFLINE_BOOKS = [
  { id: 'ol1', title: 'The Hobbit', image: 'https://covers.openlibrary.org/b/id/6979861-L.jpg' },
  { id: 'ol2', title: 'Dune', image: 'https://covers.openlibrary.org/b/id/12817859-L.jpg' },
  { id: 'ol3', title: '1984', image: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' },
  { id: 'ol4', title: 'Pride and Prejudice', image: 'https://covers.openlibrary.org/b/id/12648772-L.jpg' },
  { id: 'ol5', title: 'The Great Gatsby', image: 'https://covers.openlibrary.org/b/id/10572752-L.jpg' },
  { id: 'ol6', title: 'Harry Potter', image: 'https://covers.openlibrary.org/b/id/10521270-L.jpg' },
]
