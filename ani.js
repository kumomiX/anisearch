#!/usr/bin/env node

const puppeteer = require('puppeteer')
const mpv = require('node-mpv')
const rl = require('readline')

function prompt(question) {
  var r = rl.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  })
  return new Promise((resolve, error) => {
    r.question(question, answer => {
      r.close()
      resolve(answer)
    })
  })
}

;(async () => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  page.setViewport({ width: 400, height: 600 })

  const userAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_1_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.79 Mobile/14B100 Safari/602.1'
  page.setUserAgent(userAgent)

  /* block images */
  await page.setRequestInterception(true)
  page.on('request', request => {
    if (request.resourceType() === 'image') request.abort()
    else request.continue()
  })

  /* check for argv arguments */
  let keyword = process.argv[2]
  if (!keyword) {
    browser.close()
    return console.log('Usage: ani title_alsotitle (episode) (host)')
  }
  keyword = keyword.split('_').join(' ')

  /* goto kissanime */

  await page.goto(`http://kissanime.ru/M?key=${keyword}&sort=search`)
  await page.cookies()
  /* search for provided title */

  const search = async () => {
    let RESULT_NUMBER = 1

    let RESULT = `#divContentList > article:nth-child(${RESULT_NUMBER}) > div.post-content > h2 > a`
    await page.waitFor(RESULT)
    const RESULTS_LENGTH = await page.evaluate(
      sel => document.querySelectorAll(sel).length,
      '#divContentList > article'
    )
    console.log(`Found ${RESULTS_LENGTH} results: `)

    for (let i = 1; i < RESULTS_LENGTH + 1; i++) {
      RESULT_NUMBER = i
      RESULT = `#divContentList > article:nth-child(${RESULT_NUMBER}) > div.post-content > h2 > a`

      await page.waitFor(RESULT)
      let resultText = await page.evaluate(
        sel => document.querySelector(sel).innerText,
        RESULT
      )
      console.log(`${i}: ${resultText}`)
    }
    RESULT_NUMBER = await prompt('Choose one: ')
    RESULT = `#divContentList > article:nth-child(${RESULT_NUMBER}) > div.post-content > h2 > a`
    const href = await page.evaluate(
      sel => document.querySelector(sel).href,
      RESULT
    )

    return href
  }

  let href = await search()
  page.goto(href)

  await page.waitForNavigation()
  //await page.waitFor(50)

  let desiredEpisode = process.argv[3]

  const EPISODES_SELECTOR = `div.episode`

  await page.waitFor(EPISODES_SELECTOR)
  let numOfEpisodes = await page.evaluate(sel => {
    return document.querySelectorAll(sel).length
  }, EPISODES_SELECTOR)
  if (numOfEpisodes === 1) desiredEpisode = 1

  const askForEpisodeNumber = async () => {
    desiredEpisode = await prompt(
      `Found ${numOfEpisodes} episodes. Which one would you like to watch? `
    )

    return desiredEpisode
  }
  if (!desiredEpisode) {
    desiredEpisode = await askForEpisodeNumber()
  }

  const getSrc = async () => {
    const nthChild = numOfEpisodes - (desiredEpisode - 1)
    const episode = '#adsFloat > div.content > div:nth-child(8) > div:nth-child(NTH_CHILD)'.replace(
      /NTH_CHILD/,
      nthChild
    )
    await page.click(episode)

    //await page.waitFor(50)

    await page.waitFor('iframe#mVideo')
    const src = await page.evaluate(
      () => document.querySelector('iframe#mVideo').src
    )
    return src
  }
  const src = await getSrc()

  browser.close()

  /* starting mpv */
  console.log('starting mpv')
  let mpvPlayer = new mpv()
  await mpvPlayer.load(src)
  mpvPlayer.on('exit', function() {
    console.log('Gimme more music')
  })
})()
