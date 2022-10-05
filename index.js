const stripe = require('stripe')(
  'sk_test_51Lm88LGvhFY600fnBDaOI80CZ86HHSpj6wtrENAv1sNbuM8oYJy0trLaJUZavk5yNyFThSwfnStnzgzDSIBkFw0Y00Xz0BMWTq'
);
const fastify = require('fastify')({ logger: false });

fastify.post('/create-payment-intent', async () => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: 'usd',
  });
  const clientSecret = paymentIntent.client_secret;

  return { clientSecret };
});

// Declare a route
fastify.post('/payment-sheet', async (request, reply) => {
  // Use an existing Customer ID if this is a returning customer.
  // const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: 'cus_MWKDh89XB0wYUV' },
    { apiVersion: '2022-08-01' }
  );
  const setupIntent = await stripe.setupIntents.create({
    customer: 'cus_MWKDh89XB0wYUV',
  });
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: 'eur',
    customer: 'cus_MWKDh89XB0wYUV',
    automatic_payment_methods: {
      enabled: true,
    },
  });
  return {
    setupIntent: setupIntent.client_secret,
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: 'cus_MWKDh89XB0wYUV',
    publishableKey:
      'pk_test_51Lm88LGvhFY600fnzCvBesBTFDMwLl23fn2M135R1iy5P1W1giH7btx8yHJazHoIyKYRCfceMd9MgNGL0KWFkzHI00oAQMtdAn',
  };
});

fastify.get('/payment-methods', async () => {
  const paymentMethods = await stripe.customers.listPaymentMethods(
    'cus_MWKDh89XB0wYUV',
    { type: 'card' }
  );

  return {
    count: paymentMethods.data.length,
    data: paymentMethods.data,
  };
});

fastify.post('/create-payment-method', async (req, res) => {
  try {
    const { card_number, exp_month, exp_year, cvv } = req.body;
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: card_number,
        exp_month: +exp_month,
        exp_year: +exp_year,
        cvc: cvv,
      },
    });

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: 'cus_MWKDh89XB0wYUV',
    });

    return {
      statusCode: 200,
      message: 'Add credit card successfully.',
      paymentMethod,
    };
  } catch (error) {
    res.code(400).send(error);
  }
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
