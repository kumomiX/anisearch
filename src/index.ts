import * as yargs from 'yargs'
import MasterAnime from './MasterAnime'
import searchForAnime from './search'
import playAnime from './play'

/**
 * parses argv arguments
 */
const argv = yargs
  .options({
    search: {
      demand: false,
      alias: 's',
      describe: 'string to search for',
      string: true,
    },
    play: {
      demand: false,
      alias: 'p',
      describe: 'anime to play',
      string: true,
    },
    episode: {
      demand: false,
      alias: 'e',
      describe: 'episode to play',
      string: true,
    },
  })
  .help()
  .alias('help', 'h').argv

/* tslint:disable-next-line */
;(async () => {
  if (argv.search) {
    searchForAnime(argv.search, argv.episode)
  } else if (argv.play) {
    const res = await MasterAnime.search(argv.play)
    const slug = res[0].slug
    playAnime(slug, argv.episode)
  } else {
    console.log('You didnt provide enough arguments')
  }
})()
