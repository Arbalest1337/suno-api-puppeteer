import UserAgent from 'user-agents'
import { cookie2Arr } from './utils.js'
import { PuppeteerPool } from './PuppeteerPool.js'

export const BASE_URL = 'https://studio-api.suno.ai'
export const CLERK_BASE_URL = 'https://clerk.suno.com'

export class Suno {
  cookie
  cookieArr
  userAgent
  sessionId
  jwt
  pool
  constructor(cookie) {
    if (!cookie) throw Error('No cookie!')
    this.cookie = cookie
    this.cookieArr = cookie2Arr(this.cookie)
    this.userAgent = new UserAgent(/Chrome/).random().toString()
    this.pool = new PuppeteerPool()
    this.init()
  }

  async init() {
    try {
      await this.pool.init()
      await this.getSessionId()
      await this.getJwt()
    } catch (err) {
      console.log('Suno init error :', err)
    }
  }

  async usePage(callback, method = 'GET') {
    const page = await this.pool.getPage()
    const isPost = method.toUpperCase() === 'POST'
    await page.setCookie(...this.cookieArr)
    const interceptor = interceptedRequest => {
      interceptedRequest.continue({
        method: method.toUpperCase(),
        headers: { 'User-Agent': this.userAgent }
      })
    }
    await page.setRequestInterception(true)
    page.on('request', interceptor)
    try {
      await callback?.(page)
    } finally {
      page.off('request', interceptor)
      this.pool.releasePage(page)
    }
  }

  async getSessionId() {
    await this.usePage(async page => {
      const url = `${CLERK_BASE_URL}/v1/client?_clerk_js_version=5.42.0`
      const res = await page.goto(url)
      const resJson = await res.json()
      const sessionId = resJson?.response?.last_active_session_id
      this.sessionId = sessionId
      console.log({ sessionId })
    })
  }

  async getJwt() {
    if (!this.sessionId) throw new Error('no sessionId!')
    const url = `${CLERK_BASE_URL}/v1/client/sessions/${this.sessionId}/tokens?_clerk_js_version=5.42.0`
    await this.usePage(async page => {
      const res = await page.goto(url)
      const resJson = await res.json()
      const { jwt } = resJson
      this.jwt = jwt
      console.log({ jwt })
    }, 'POST')
  }

  initFetchHeaders() {
    return {
      'User-Agent': this.userAgent,
      ['Cookie']: this.cookie,
      ['Authorization']: `Bearer ${this.jwt}`
    }
  }

  async getCredits() {
    await this.getJwt()
    const url = `${BASE_URL}/api/billing/info/`
    const res = await fetch(url, {
      headers: { ...this.initFetchHeaders() }
    }).then(res => res.json())
    return res
  }

  async generate({ prompt = '', make_instrumental = false }) {
    await this.getJwt()
    const payload = {
      gpt_description_prompt: prompt,
      make_instrumental,
      mv: 'chirp-v3-5'
    }
    const url = `${BASE_URL}/api/generate/v2/`
    const res = await fetch(url, {
      method: 'post',
      data: JSON.stringify(payload),
      headers: { ...this.initFetchHeaders() }
    }).then(res => res.json())
    return res
  }

  async get(ids = []) {
    await this.getJwt()
    let url = `${BASE_URL}/api/feed/`
    if (ids?.length) url = `${url}?ids=${ids.join(',')}`
    const res = await fetch(url, { headers: { ...this.initFetchHeaders() } }).then(res =>
      res.json()
    )
    return res
  }
}
