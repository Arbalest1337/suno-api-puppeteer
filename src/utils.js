export const cookie2Arr = cookieStr =>
  cookieStr
    .split(';')
    .filter(Boolean)
    .map(item => item.trim().split('='))
    .map(([key, value]) => ({
      name: key,
      value,
      domain: 'clerk.suno.com'
    }))
