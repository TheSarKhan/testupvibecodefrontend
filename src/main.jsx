import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'katex/dist/katex.min.css'
import App from './App.jsx'
import { registerWebMcpTools } from './lib/webmcp'

// Declare the site's tools to any AI agent driving this browser. No-ops where
// the WebMCP API is absent, which is still every stable browser today.
registerWebMcpTools()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
