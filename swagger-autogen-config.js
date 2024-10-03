// swagger-autogen-config.js
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Club Management API',
    description: 'API documentation for the club management system',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/authRoutes.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
