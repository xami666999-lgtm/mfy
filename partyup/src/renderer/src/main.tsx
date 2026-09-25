import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import App from './App';
import './app.scss';

declare global {
  interface Window {
    electron: any;
    api: any;
  }
}

if (window.electron) {
  window.electron.ipc.on('theme:apply', (_event: any, themeData: any) => {
    const root = document.documentElement;
    const colors = themeData.colors;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value as string);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
