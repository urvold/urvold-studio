import '@fontsource-variable/manrope';
import './style.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import deployment from '../deployment.json';
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter basename={deployment.basePath}><App/></BrowserRouter></React.StrictMode>);
