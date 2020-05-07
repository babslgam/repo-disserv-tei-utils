const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const helpers = require('./helpers.js');
const cache = require('./cache.js');
const resource = require('./resource.js');
const queries = require('./queries.js');


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Repo Dissermination Service for XML Data',
      version: '1.0.0',
    },
  },
  //  Path to the API docs
  apis: ['./router.js'],
};

const swaggerSpec = swaggerJSDoc(options);

router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 *
 * definitions:
 *   Resource:
 *     type: object,
 *     properties:
 *       id:
 *         type: integer
 *         format: int64
 */


/**
 * @swagger
 * /resources:
 *   get:
 *     description: Returns cached resources
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: limit
 *         description: Limit number of returned resources.
 *         in: header
 *         required: false
 *         type: integer
 *         default: 50
 *     responses:
 *       200:
 *         description: resources
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Resource'
 */

router.get('/resources', (req, res) => {
  const cachedResources = cache.getResources();
  res.json(cachedResources);
});

/**
 * @swagger
 *
 *   /resources/{id}:
 *     get:
 *       description: Returns cached resource
 *       produces:
 *         - application/json
 *       parameters:
 *         - name: id
 *           description: Numeric id of resource to get.
 *           in: path
 *           required: true
 *           type: integer
 *       responses:
 *         200:
 *           description: resource with given id
 *           schema:
 *             $ref: '#/definitions/Resource'
 */

router.get('/resources/:id', (req, res) => {
  const archeResourceId = req.params.id;
  const result = cache.getResource(archeResourceId);
  if (result) {
    res.json(result);
  } else {
    res.status(204).send('Resource not found');
  }
});

router.get('/resources/:resourceId/import', async (req, res) => {
  const archeResourceId = req.params.resourceId;
  try {
    const reqResult = await helpers.validateRequest(archeResourceId);
    if (reqResult.status === 200) {
      helpers.importResource(archeResourceId).then((rs) => {
        cache.storeResource(archeResourceId, reqResult.binaryUpdateDate);
        res.status(rs.status).send(rs.statusText);
      });
    } else {
      res.status(reqResult.status).send(reqResult.statusText);
    }
  } catch (err) {
    console.log(err);
  }
});

router.get('/resources/:id/elements', (req, res) => {
  let qr;
  req.query.limit = 50;
  const grouped = req.query.grouped ? req.query.grouped : false;
  const elementName = req.query.element ? req.query.element.replace(/\*/g, '%') : '%%';
  const text = req.query.text ? req.query.text.replace(/\*/g, '%') : '%%';
  const archeResourceId = req.params.id;

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


module.exports = router;
