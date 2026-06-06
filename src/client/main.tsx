import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LoadingProvider } from './context/LoadingContext';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(
    <StrictMode>
        <LoadingProvider>
            <App />
        </LoadingProvider>
    </StrictMode>
);
