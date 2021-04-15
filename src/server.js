const express = require('express');
const app = express();

const port = process.env.PORT;
app.use('/public', express.static('public'));
app.get('/', (_, res) => res.end('Hello World!'));

module.exports = app;
