// Test if mocks are being loaded
jest.mock('@/components/ui/skeleton', () => {
  const React = require('react')
  console.log('SKELETON MOCK LOADED')
  return {
    __esModule: true,
    Skeleton: (props) => {
      console.log('SKELETON RENDERED', props)
      return React.createElement('div', { 'data-testid': 'skeleton-loader' }, 'Skeleton')
    },
  }
})

const { Skeleton } = require('./src/components/ui/skeleton')
console.log('Skeleton:', typeof Skeleton, Skeleton)
