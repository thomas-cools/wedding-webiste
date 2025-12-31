import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import theme from './theme'

interface WrapperProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: WrapperProps) => {
  return (
    <ChakraProvider theme={theme}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </ChakraProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
