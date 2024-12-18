import 'dotenv/config'
import express from 'express'
import { Suno } from './src/suno-puppeteer.js'

const suno = new Suno(process.env.SUNO_COOKIE)

const PORT = 6657
const app = express()
app.use(express.json())

const GlobalMiddleware = (req, res, next) => {
  console.log(new Date().toLocaleString(), req.method, req.url, req.body)
  next()
}
app.use(GlobalMiddleware)

app.get('/generate', async (req, res) => {
  try {
    const { prompt, make_instrumental } = req.query
    const response = await suno.generate({ prompt, make_instrumental })
    res.send(success(response))
  } catch (err) {
    res.send(failed(err))
  }
})

app.get('/get', async (req, res) => {
  try {
    const response = await suno.get()
    res.send(success(response))
  } catch (err) {
    res.send(failed(err))
  }
})

app.get('/credits', async (req, res) => {
  try {
    const response = await suno.getCredits()
    res.send(success(response))
  } catch (err) {
    res.send(failed(err))
  }
})

app.get('/init', async (req, res) => {
  try {
    const response = await suno.init()
    res.send(success('init finished'))
  } catch (err) {
    res.send(failed(err))
  }
})

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`)
})

const success = (data = {}) => {
  return {
    code: 200,
    success: true,
    message: 'success',
    data
  }
}

const failed = (err = {}) => {
  console.log(err)
  return {
    code: 500,
    success: false,
    message: 'failed',
    data: err
  }
}
