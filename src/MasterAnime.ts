import fetch from 'node-fetch'

interface IAnime {
  title: string
  slug: string
  episode_count: number
}

interface IVideoPage {
  query?: string
  ep?: string
  slug?: string
}

/**
 * MasterAnime api
 *
 * @export
 * @class MasterAnime
 */
export default class MasterAnime {
  /**
   * baseUrl
   *
   * @static
   * @type {string}
   * @memberof MasterAnime
   */
  static baseUrl: string = 'https://www.masterani.me/api/anime'

  /**
   * get info about an anime by it's slug
   *
   * @static
   * @param {string} animeSlug - anime slug (1446-overlord)
   * @param {boolean} [detailed] - get detailed info
   * @returns {Promise<IAnime>} anime info
   * @memberof MasterAnime
   */
  static async getAnimeInfo(
    animeSlug: string,
    detailed?: boolean
  ): Promise<IAnime> {
    const info = await fetch(
      `${this.baseUrl}/${animeSlug}${detailed && '/detailed'}`
    ).then(r => r.json())

    return info
  }

  /**
   * search for anime
   *
   * @static
   * @param {string} query - search query
   * @returns top 3 search results
   * @memberof MasterAnime
   */
  static async search(query: string): Promise<IAnime[]> {
    const searchResults = await fetch(
      `${this.baseUrl}/search?search=${query}`
    ).then(r => r.json())

    return searchResults.slice(0, 3)
  }

  /**
   * print search results in the format of: [index]  title
   *
   * @static
   * @param {IAnime[]} titles anime titles list
   * @memberof MasterAnime
   */
  static printSearchResults(titles: IAnime[]) {
    titles.forEach((t, i) => {
      console.log(`[${i}]  ${t.title}`)
    })
  }

  /**
   * return direct video page url, needed for puppeteer
   *
   * @static
   * @param {IVideoPage} { query?, ep?, slug? }
   * @returns
   * @memberof MasterAnime
   */
  static async getVideoPageUrl({ query, ep, slug }: IVideoPage) {
    const searchForSlug = async (q: string) => {
      const res = await this.search(query)
      return res[0].slug
    }
    const anime = slug ? slug : await searchForSlug(query)

    return `https://www.masterani.me/anime/watch/${anime}/${ep && ep}`
  }
}
