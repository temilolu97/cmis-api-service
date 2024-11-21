const express = require('express');
const app = express();
const cors = require('cors')
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const authRoutes = require('./routes/authRoutes')
const rolesRoutes = require('./routes/rolesRoutes')
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const eventRoutes = require('./routes/eventRoutes')
const employeeRoute = require('./routes/employeeRoutes')
const fanRoutes = require('./routes/fanRoutes')
const sponsorshipRoutes = require('./routes/sponsorshipRoutes')
const hooksRoutes = require('./routes/hookRoutes')
const walletRoutes = require('./routes/walletRoutes')
const metricRoutes = require('./routes/metricsRoutes')
const swaggerDocument = require('./swagger-output.json')
const swaggerUi = require('swagger-ui-express')
const cron = require('node-cron');
const axios = require('axios');

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());

// Routes
// app.use('/api/users', userRoutes);
// app.use('/api/teams', teamRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'Server is up and running!' });
});

cron.schedule('*/10 * * * *', async () => {
    try {
        console.log('Pinging the server to keep it alive...');
        await axios.get('https://cmis-api-service.onrender.com/');
        console.log('Ping successful');
    } catch (error) {
        console.error('Error pinging the server:', error.message);
    }
});

app.use('/api/auth', authRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/employees', employeeRoute)
app.use('/api/events', eventRoutes)
app.use('/api/hooks', hooksRoutes)
app.use('/api/fans', fanRoutes)
app.use('/api/sponsorships', sponsorshipRoutes)
app.use('/api/wallets', walletRoutes)
app.use('/api/metrics', metricRoutes)



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


module.exports = app;
