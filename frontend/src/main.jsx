import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { HashRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

async function initMSW() {
  if (import.meta.env.MODE === 'development') {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: { scope: '/' }
      },
      onUnhandledRequest: 'bypass'
    });
    console.log('[MSW] 🚀 서비스 워커 시작 완료!');
  }
}

function startApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <HashRouter>
        <UserProvider>
          <ToastContainer position="top-center" autoClose={1000} />
          <App />
        </UserProvider>
      </HashRouter>
    </React.StrictMode>
  );
}

initMSW().then(startApp);