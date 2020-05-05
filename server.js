const express = require('express');
const cache = require('./cache.js');
const resource = require('./resource.js');
const helpers = require('./helpers.js');
const queries = require('./queries.js');

const app = express();

cache.init();
app.get('/', (req, res) => {
  res.send('test');
});
app.get('/resources', (req, res) => {
  const cachedResources = cache.getResources();
  res.send(cachedResources);
});

app.get('/resources/:resourceId', (req, res) => {
  const archeResourceId = req.params.resourceId;
  helpers.validateRequest(archeResourceId).then((validationResult) => {
    res.send(validationResult.response);
  });
});

app.get('/resources/:resourceId/stats', (req, res) => {
  let qr;
  const grouped = req.query.grouped ? req.query.grouped : false;
  const elementName = req.query.element ? req.query.element.replace(/\*/g, '%') : '%%';
  const text = req.query.text ? req.query.text.replace(/\*/g, '%') : '%%';
  const archeResourceId = req.params.resourceId;
  helpers.validateRequest(archeResourceId).then((validationResult) => {
    if (validationResult.response.message === 'Resource already stored and up to date') {
      if (!grouped) {
        qr = resource.query(archeResourceId, queries.elements, elementName, text);
      } else {
        qr = resource.query(archeResourceId, queries.distinctElements, elementName, text);
      }
      res.send(qr);
    }
  });
});

app.get('/resources/:resourceId/import', (req, res) => {
  const archeResourceId = req.params.resourceId;
  helpers.validateRequest(archeResourceId).then((validationResult) => {
    if (validationResult.response.message === 'Resource not imported yet.') {
      helpers.importResource(archeResourceId).then((rs) => {
        cache.storeResource(archeResourceId, validationResult.binaryUpdateDate);
        res.send(rs.message);
      });
    } else {
      res.send(validationResult.result.message);
    }
  });
});
app.listen(3000);
