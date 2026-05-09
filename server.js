const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/requests', require('./routes/requests'));

app.get('/', (req, res) => {
    res.send('Naryn Tourism API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
