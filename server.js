const express = require('express');

const router = require('./router.js');
const cache = require('./cache.js');

const app = express();

app.use('/', router);

cache.init();

app.listen(3000);
