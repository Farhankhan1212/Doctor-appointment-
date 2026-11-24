import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ConfigProvider, theme } from 'antd';
import './theme.css';

// Futuristic dark theme for every Ant Design component (the CSS layer in theme.css adds the glow/glass).
const neoTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#6366f1',
    colorInfo: '#22d3ee',
    colorSuccess: '#34d399',
    colorWarning: '#fbbf24',
    colorError: '#fb7185',
    colorBgBase: '#0a1022',
    colorBgContainer: '#0f1734',
    colorBgElevated: '#121c3d',
    colorBorder: 'rgba(125, 140, 255, 0.28)',
    colorBorderSecondary: 'rgba(125, 140, 255, 0.16)',
    colorText: '#e8ecff',
    colorTextSecondary: '#a3aed6',
    colorTextPlaceholder: 'rgba(163, 174, 214, 0.6)',
    borderRadius: 12,
    fontFamily: "'Inter', 'Poppins', system-ui, sans-serif",
  },
};

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={neoTheme}>
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);