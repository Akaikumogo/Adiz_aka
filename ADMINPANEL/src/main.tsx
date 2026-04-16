import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import './index.css'
import App from './App.tsx'

dayjs.locale('en')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
