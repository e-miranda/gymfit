import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installStaticApiFallback } from './utils/staticApiFallback';

installStaticApiFallback();

createRoot(document.getElementById('root')!).render(<App />);
