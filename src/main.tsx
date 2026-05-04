import React from 'react';
import ReactDOM from 'react-dom/client';
import '98.css';
import './styles/reset.css';
import './styles/variables.css';
import './styles/98-overrides.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
