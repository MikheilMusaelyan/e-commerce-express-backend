const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require("http");

require('dotenv').config();

const app = express();

const port = process.env.PORT || '3000'

const server = http.createServer(app);
app.set('port', port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, auth'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'POST, GET, PATCH, PUT, DELETE, OPTIONS'
    );
    next();
});

app.post('/create-customer', async (req, res) => {
   
}); // can I put post here? and app.use?


module.exports = app