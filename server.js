const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

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
        return res.status(200).send({ 
            error: { message: error.message } 
        });
    }
    
    let updateCustomerDefaultPaymentMethod = await stripe.customers.update( 
        req.body.customerID,
        { 
            invoice_settings: { 
                default_payment_method: paymentMethod.id 
            } 
        }
    );

    subscription = await stripe.subscriptions.create({
      customer: req.body.customerID,
      items: [{ price: "p" }],
      expand: ["latest_invoice.payment_intent"]
    })
    res.send(subscription)
}); 

module.exports = app