import React, { createContext, useEffect } from 'react'

const ThemeContext = createContext<object | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  )
}
