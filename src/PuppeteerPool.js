import puppeteer from 'puppeteer'

export class PuppeteerPool {
  constructor(maxPages) {
    this.maxPages = maxPages ?? 8
    this.browser = null
    this.pages = []
  }

  async init() {
    this.browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    })
    for (let i = 0; i < this.maxPages; i++) {
      const page = await this.browser.newPage()
      this.pages.push(page)
    }
  }

  async getPage() {
    while (this.pages.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    return this.pages.pop()
  }

  releasePage(page) {
    this.pages.push(page)
  }

  async close() {
    await this.browser.close()
  }
}
