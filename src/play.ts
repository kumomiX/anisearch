import MasterAnime from './MasterAnime'
import { askToMakeAChoice } from './util'
import extractVideoLinks from './extractVideoLinks'
import { spawn } from 'child_process'

const playAnime = async (slug: string, episode?: string) => {
  const selectedAnime = await MasterAnime.getAnimeInfo(slug)
  console.log(`Playing anime ${selectedAnime.title}...`)

  if (!episode) {
    console.log(
      `${selectedAnime.title} has ${
        selectedAnime.episode_count
      } episodes. Which one would you like to watch?`
    )
  }

  /* choose desired episode */
  const ep = episode || (await askToMakeAChoice())

  const pageUrl = await MasterAnime.getVideoPageUrl({
    slug: selectedAnime.slug,
    ep,
  })

  const src = await extractVideoLinks(pageUrl)

  const player = spawn('iina', [src], { detached: false })

  process.on('exit', () => player.kill())
}

export default playAnime
