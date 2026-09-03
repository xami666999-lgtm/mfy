import animeJson from '../../public/data/anime.json'
import mangaJson from '../../public/data/manga.json'

export const OFFLINE_ANIME = (animeJson as any).anime || []
export const OFFLINE_MANGA = (mangaJson as any).manga || []

export const OFFLINE_COMICS = [
  { id: 'c1', title: 'Watchmen', image: 'https://covers.openlibrary.org/b/olid/OL22856696M-L.jpg', poster_path: 'https://covers.openlibrary.org/b/olid/OL22856696M-L.jpg' },
  { id: 'c2', title: 'Batman: Year One', image: 'https://covers.openlibrary.org/b/id/8235666-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/8235666-L.jpg' },
  { id: 'c3', title: 'The Dark Knight Returns', image: 'https://covers.openlibrary.org/b/id/9259256-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/9259256-L.jpg' },
  { id: 'c4', title: 'Spider-Man', image: 'https://covers.openlibrary.org/b/id/10523327-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/10523327-L.jpg' },
  { id: 'c5', title: 'X-Men', image: 'https://covers.openlibrary.org/b/id/10481457-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/10481457-L.jpg' },
  { id: 'c6', title: 'Saga', image: 'https://covers.openlibrary.org/b/id/8313805-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/8313805-L.jpg' },
  { id: 'c7', title: 'Invincible', image: 'https://covers.openlibrary.org/b/id/10415564-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/10415564-L.jpg' },
  { id: 'c8', title: 'Sandman', image: 'https://covers.openlibrary.org/b/id/8231123-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/8231123-L.jpg' },
  { id: 'c9', title: 'Superman', image: 'https://covers.openlibrary.org/b/id/9252011-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/9252011-L.jpg' },
  { id: 'c10', title: 'Wonder Woman', image: 'https://covers.openlibrary.org/b/id/10539912-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/10539912-L.jpg' },
  { id: 'c11', title: 'Avengers', image: 'https://covers.openlibrary.org/b/id/10447023-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/10447023-L.jpg' },
  { id: 'c12', title: 'Hellboy', image: 'https://covers.openlibrary.org/b/id/8310128-L.jpg', poster_path: 'https://covers.openlibrary.org/b/id/8310128-L.jpg' },
]

export const OFFLINE_BOOKS = [
  { id: 'ol1', title: 'The Hobbit', image: 'https://covers.openlibrary.org/b/id/6979861-L.jpg' },
  { id: 'ol2', title: 'Dune', image: 'https://covers.openlibrary.org/b/id/12817859-L.jpg' },
  { id: 'ol3', title: '1984', image: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' },
  { id: 'ol4', title: 'Pride and Prejudice', image: 'https://covers.openlibrary.org/b/id/12648772-L.jpg' },
  { id: 'ol5', title: 'The Great Gatsby', image: 'https://covers.openlibrary.org/b/id/10572752-L.jpg' },
  { id: 'ol6', title: 'Harry Potter', image: 'https://covers.openlibrary.org/b/id/10521270-L.jpg' },
]
