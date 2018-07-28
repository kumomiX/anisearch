import * as puppeteer from 'puppeteer'

const extractVideoLinks = async (url: string) => {
  const browser = await puppeteer.launch({
    headless: true,
  })
  try {
    const page = await browser.newPage()
    page.setViewport({ width: 1280, height: 800 })
    page.setCacheEnabled(true)
    // const userAgent =
    /* tslint:disable-next-line */
    //   'Mozilla/5.0 (iPhone; CPU iPhone OS 10_1_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.79 Mobile/14B100 Safari/602.1'
    // page.setUserAgent(userAgent)

    /* block images */
    // await page.setRequestInterception(true)
    // page.on('request', request => {
    //   if (request.resourceType() === 'image') request.abort()
    //   else request.continue()
    // })

    // block redirects
    await page.setRequestInterception(true)
    page.on(
      'request',
      request =>
        request.isNavigationRequest() && request.redirectChain().length
          ? request.abort()
          : request.continue()
    )

    await page.goto(url)

    const VIDEO = '#videoJSContainer_html5_api'

    const frames = await page.frames()
    const moeFrame = frames.find(f => f.url().search('stream.moe/embed') !== -1)
    const moePlayerFrame = moeFrame.childFrames()[0]

    await moePlayerFrame.waitForSelector(VIDEO)

    const moeSrc = await moePlayerFrame.evaluate(
      sel => document.querySelector(sel).src,
      VIDEO
    )

    return Promise.resolve(moeSrc)
  } catch (error) {
    // tslint:disable-next-line
    console.log("Couldn't find any videos")
    return Promise.reject()
  } finally {
    browser.close()
  }
}

export default extractVideoLinks
