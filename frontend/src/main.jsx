import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {BrowserRouter} from 'react-router-dom'
import StoreContextProvider from './Context/StoreContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="78746459454-c6428b4dgmpker8omk3uf1jalst5vnua.apps.googleusercontent.com">
    <BrowserRouter>
      <StoreContextProvider>
        <App />
      </StoreContextProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
)
