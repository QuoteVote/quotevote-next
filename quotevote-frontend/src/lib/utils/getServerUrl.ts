export const getBaseServerUrl = (): string => {
  // 1. Priority: Check NEXT_PUBLIC_SERVER_URL (the validated env var)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SERVER
      if (serverUrl) {
        return serverUrl
      }
    }
  } catch (_e) {
    // ignore env access errors in non-Node environments
  }

  // 2. Check NEXT_PUBLIC_GRAPHQL_ENDPOINT and strip /graphql
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT) {
      return process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT.replace(/\/graphql\/?$/, '')
    }
  } catch (_e) {
    // ignore env access errors in non-Node environments
  }

  // 3. Fallback: Use window.location to detect Netlify deploy preview
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : ''

  if (currentUrl && currentUrl.includes('deploy-preview')) {
    // Sample currentUrl: https://deploy-preview-237--quotevote.netlify.app
    // Also supports: https://deploy-preview-275--quotevote-monorepo.netlify.app
    const prMatch = currentUrl.match(/deploy-preview-(\d+)/)
    if (prMatch && prMatch[1]) {
      const PR_NUMBER = prMatch[1]
      return `https://quotevote-api-quotevote-monorepo-pr-${PR_NUMBER}.up.railway.app`
    }
  }

  return 'https://api.quote.vote'
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