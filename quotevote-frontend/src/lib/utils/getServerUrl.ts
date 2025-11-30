export const getBaseServerUrl = (): string => {
  let effectiveUrl = 'https://api.quote.vote'

  // 1. Priority: Check process.env (allows manual override in Netlify UI)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SERVER) {
      effectiveUrl = process.env.NEXT_PUBLIC_SERVER
      return effectiveUrl
    }
  } catch (_e) {
    // ignore env access errors in non-Node environments
  }

  // 2. Fallback: Use window.location to detect Netlify deploy preview
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : ''

  if (currentUrl && currentUrl.includes('deploy-preview')) {
    // Sample currentUrl: https://deploy-preview-237--quotevote.netlify.app
    // Also supports: https://deploy-preview-275--quotevote-monorepo.netlify.app
    const prMatch = currentUrl.match(/deploy-preview-(\d+)/)
    if (prMatch && prMatch[1]) {
      const PR_NUMBER = prMatch[1]
      effectiveUrl = `https://quotevote-api-quotevote-monorepo-pr-${PR_NUMBER}.up.railway.app`
    }
  }
  return effectiveUrl
}

export const getGraphqlServerUrl = (): string => {
  const baseUrl = getBaseServerUrl()
  return `${baseUrl}/graphql`
}

export const getGraphqlWsServerUrl = (): string => {
  const baseUrl = getBaseServerUrl()
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    return baseUrl.replace('http://', 'ws://').replace('https://', 'ws://') + '/graphql'
  }
  const replacedUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://')
  return `${replacedUrl}/graphql`
}