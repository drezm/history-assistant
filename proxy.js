const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Настройка прокси для Ollama
app.use(
    '/ollama',
    createProxyMiddleware({
        target: 'http://localhost:11434',
        changeOrigin: true,
        pathRewrite: { '^/ollama': '' },
        onProxyRes: (proxyRes) => {
            // Добавляем заголовки CORS
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
        },
    })
);

// Запуск сервера на порту 3000
app.listen(3000, () => {
    console.log('Прокси-сервер запущен на http://localhost:3000');
});