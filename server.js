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
    // Create a new customer object
    const customer = await stripe.customers.create({
        email: req.body.email,
    });
    // save the customer.id as stripeCustomerId
    res.send({ customer });
});

app.post('/create-subscription', async (req, res) => { // Set the default payment method on the customerlet paymentMethod;
    try {
        paymentMethod = await stripe.paymentMethods.attach(
            req.body.paymentMethodId.id,
            { customer: req.body.customerID }
        );
    } catch (error) {
        return res.status(500).send({ 
            error: { message: error.message } 
        });
    }
    
    await stripe.customers.update( 
        req.body.customerID,
        { 
            invoice_settings: { 
                default_payment_method: paymentMethod.id 
            } 
        }
    );
        
    subscription = await stripe.subscriptions.create({
      customer: req.body.customerID,
      items: [{ price: process.env.PRICE_ID }],
      expand: ["latest_invoice.payment_intent"]
    })
    
    const paymentIntent = await stripe.paymentIntents.create({
        amount: 1100, // Amount in cents
        currency: 'usd',
        customer: req.body.customerID,
        payment_method: paymentMethod.id,
        confirm: true // Set to true to confirm and complete the payment immediately
    });

    
    res.send({subscription, paymentIntent})
}); 

app.post('/create-checkout-session', async (req, res) => {
  const { priceId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: 'http://localhost:4200/',
      cancel_url: 'http://localhost:4200',
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      }
    });
  }
});

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


app.post('/send-email', (req, res) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'fullstackmasters0@gmail.com',
    subject: 'Shipping Address',
    text: JSON.stringify(req.body),
  };

  try{
    transporter.sendMail(mailOptions, (info) => {
      res.status(200).json({
        msg: 'Email sent successfully'
      });
    });
  }
  catch(err) {
    res.status(500).json({
      msg: 'Error sending email'
    });
  }
  
});
module.exports = app