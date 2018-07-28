import MasterAnime from './MasterAnime'
import { askToMakeAChoice } from './util'
import play from './play'

const searchForAnime = async (query: string, episode?: string) => {
  console.log(`Searching for ${query}...`)

  const results = await MasterAnime.search(query)
  console.log(`Found ${results.length} results:`)
  MasterAnime.printSearchResults(results)
  const title = await askToMakeAChoice() // choose desired search result

  play(results[title].slug, episode)
}

export default searchForAnime
