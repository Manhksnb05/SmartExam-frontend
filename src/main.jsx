import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'; // Thêm dòng này

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Phải bọc App bằng GoogleOAuthProvider thì mới hết trắng trang */}
    <GoogleOAuthProvider clientId="998118870449-qqvtdl49amprobt1c9n4287csjfq5svs.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)