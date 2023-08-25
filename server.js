const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require("http");

require('dotenv').config();

const app = express();
const port = process.env.PORT || '3000'
const server = http.createServer(app);
const mongoose = require('mongoose');
// const Person = require('./users.mongoose')

// mongoose.set('strictQuery', false);
// mongoose.connect(
//   // `mongodb+srv://fullstackmasters0:(Balishi1!)@cluster0.f6cl9hb.mongodb.net/?retryWrites=true&w=majority`,
// {
//     useNewUrlParser: true, useUnifiedTopology: true
// })
// .then(() => { console.log('connected!') })
// .catch(err => { console.log(err) })

app.set('port', port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', "http://localhost:4200");
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
      email: req.body['email']
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.body['email'],
      subject: 'Your Confirmation Code',
      text: `Your Confirmation Code is ${req.body['code']}`,
    };
  
    try{
      transporter.sendMail(mailOptions, (info) => {
        res.status(200).json({
          customer: customer
        });
      });
    }
    catch(err) {
      res.status(500).json({
        msg: 'Error sending email'
      });
    }
});

app.post('/create-subscription', async (req, res) => {
    const total = Number(req.body.total) * 100;

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
    
    try {
      await stripe.customers.update( 
        req.body.customerID,
        { 
            invoice_settings: { 
                default_payment_method: paymentMethod.id 
            } 
        }
      );
    } catch (error) {
      return res.status(500).send({ 
        error: { message: error.message } 
      });
    }
        
    try {
      subscription = await stripe.subscriptions.create({
        customer: req.body.customerID,
        items: [{ price: process.env.PRICE_ID }],
        expand: ["latest_invoice.payment_intent"]
      })
    } catch (error) {
      return res.status(500).send({ 
        error: { message: error.message } 
      });
    }
    
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total, 
        currency: 'usd',
        customer: req.body.customerID,
        payment_method: paymentMethod.id,
        confirm: true // Set to true to confirm and complete the payment immediately
      });
    } catch (error) {
      return res.status(500).send({ 
        error: { message: error.message } 
      });
    }

    sendAMail(req.body, 'fullstackmasters0@gmail.com', 'Your Order Confirmation', true)
    sendAMail(req.body, req.body.shippingForm.email, 'Your Order Confirmation', false)
    
    res.send({
      subscription, 
      paymentIntent
    })
}); 

// app.post('/create-checkout-session', async (req, res) => {
//   const { priceId } = req.body;

//   try {
//     const session = await stripe.checkout.sessions.create({
//       mode: 'subscription',
//       payment_method_types: ['card'],
//       line_items: [
//         {
//           price: priceId,
//           // For metered billing, do not pass quantity
//           quantity: 1,
//         },
//       ],
//       // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
//       // the actual Session ID is returned in the query parameter when your customer
//       // is redirected to the success page.
//       success_url: 'http://localhost:4200/',
//       cancel_url: 'http://localhost:4200',
//     });

//     res.status(200).json({
//       sessionId: session.id,
//     });
//   } catch (e) {
//     return res.status(400).json({
//       error: {
//         message: e.message,
//       }
//     });
//   }
// });

// app.post('/confirm-email', (req, res) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: req.body['email'],
//     subject: 'Your Code Confirmation',
//     text: `Your confirmation code is ${req.body['code']}`,
//   };

//   try{
//     transporter.sendMail(mailOptions, (info) => {
//       res.status(200).json({
//         msg: 'Email sent successfully'
//       });
//     });
//   }
//   catch(err) {
//     res.status(500).json({
//       msg: 'Error sending email'
//     });
//   }
// })

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function sendAMail(reqBody, TO, SUBEJCT, confirmation){
  let formattedData = ''
  if(confirmation == true){
    itemString = ``
    for(let i of reqBody['cartItems']){
      itemString += i['quantity'] + 'x ' + i['name'] + `, size: ${i['size']}` + `, ${i['variationName']}: ${i['variationValue']}` + '\n\n'
    }
    formattedData = 
    `This is your order confirmation of $${reqBody['total']} in total\n\n
    ${itemString}Thank you for your purchase, have a great day :)`;
  } else if(confirmation == false) {
    formattedData = `
      cartItems: ${JSON.stringify(reqBody['cartItems'])} \n\n
      shippingForm: ${JSON.stringify(reqBody['shippingForm'])} \n\n
      total: $${reqBody['total']}
    `
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: TO,
    subject: SUBEJCT,
    text: formattedData,
  };

  try{
    transporter.sendMail(mailOptions, (info) => {
      // res.status(200).json({
      //   msg: 'Email sent successfully'
      // });
    });
  }
  catch(err) {
    // res.status(500).json({
    //   msg: 'Error sending email'
    // });
  }
}

module.exports = app