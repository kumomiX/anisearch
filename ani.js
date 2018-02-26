#!/usr/bin/env node
const puppeteer = require('puppeteer')
const mpv = require('node-mpv')
const rl = require('readline')
const fs = require('fs')

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
  const browser = await puppeteer.launch({
    headless: true,
  })
  const page = await browser.newPage()
  page.setViewport({ width: 400, height: 600 })
  page.setCacheEnabled(true)
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
    return console.log('Usage: ani title_alsotitle (episode) (direct)')
  }

  async function saveCookies(targetFile) {
    const cookies = await page.cookies()
    const sessionFreeCookies = cookies.map(cookie => {
      return {
        ...cookie,
        expires: Date.now() / 1000 + 10 * 60,
        session: false,
      }
    })

    return saveToJSONFile(sessionFreeCookies, targetFile)
  }

  async function saveToJSONFile(jsonObj, targetFile) {
    return new Promise((resolve, reject) => {
      try {
        var data = JSON.stringify(jsonObj)

        console.log('Saving cookies')
      } catch (err) {
        console.log('Could not convert object to JSON string ! ' + err)
        reject(err)
      }

      // Try saving the file.
      fs.writeFile(targetFile, data, (err, text) => {
        if (err) reject(err)
        else {
          resolve(targetFile)
        }
      })
    })
  }
  /* check for cookies */
  async function injectCookiesFromFile(file) {
    let cb = async function(_cookies) {
      console.log('Injecting cookies from file: %s', JSON.stringify(_cookies))
      //await page.setCookie(..._cookies); // method 1
      await page.setCookie(_cookies) // method 2
    }

    fs.readFile(file, async function(err, data) {
      if (err) throw err

      let cookies = JSON.parse(data)
      //await cb(cookies); // method 1

      for (var i = 0, len = cookies.length; i < len; i++) await cb(cookies[i]) // method 2
    })
  }
  //  function getData(fileName, type) {
  //    return new Promise(function(resolve, reject) {
  //      fs.readFile(fileName, type, (err, data) => {
  //        err ? reject(err) : resolve(data)
  //      })
  //    })
  //  }
  //
  //  let noCookies = await getData('./cookie.json', 'utf8')
  //    .then(async data => {
  //      console.log('Injecting cookies')
  //      let cookies = JSON.parse(data)
  //      for (let i = 0, len = cookies.length; i < len; i++) {
  //        await page.setCookie(cookies[i])
  //      }
  //      return false
  //    })
  //    .catch(error => true)

  //const omegaLUL = await injectCookiesFromFile('./cookie.json')
  console.log('injected')
  page.waitFor(100)

  /* goto kissanime */

  if (process.argv[3] === '-d' || process.argv[4] === '-d') {
    /* direct link */
    await page.goto(`http://kissanime.ru/M/Anime/${keyword}`)

    //if (noCookies) {
    //ifsaveCookies('./cookie.json')
    //}
  } else {
    /* search */
    keyword = keyword.split('_').join(' ')
    await page.goto(`http://kissanime.ru/M?key=${keyword}&sort=search`)

    /* search for provided title */
    const search = async () => {
      let RESULT_NUMBER = 1

      let RESULT = `#divContentList > article:nth-child(${RESULT_NUMBER}) > div.post-content > h2 > a`
      await page.waitFor(RESULT)
      const RESULTS_LENGTH = await page.evaluate(
        sel => document.querySelectorAll(sel).length,
        '#divContentList > article'
      )
      if (RESULTS_LENGTH === 0) console.log(`Found ${RESULTS_LENGTH} results: `)

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
  }
  await page.waitForNavigation()

  /* choosing an episode */
  let desiredEpisode = process.argv[3]

  const EPISODES_SELECTOR = 'div.episode'
  await page.waitFor(EPISODES_SELECTOR)
  let numOfEpisodes = await page.evaluate(sel => {
    return document.querySelectorAll(sel).length
  }, EPISODES_SELECTOR)
  if (numOfEpisodes === 1) desiredEpisode = 1 // if there's only one episode

  if (!desiredEpisode || desiredEpisode === '-d') {
    desiredEpisode = await prompt(
      `Found ${numOfEpisodes} episodes. Which one would you like to watch? `
    )
  }

  const getSrc = async () => {
    const nthChild = numOfEpisodes * 2 - 1 - 2 * (desiredEpisode - 1)
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
