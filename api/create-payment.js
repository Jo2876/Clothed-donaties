export default async function handler(req, res) {
  const { amount, email, name } = req.query;

  const response = await fetch("https://api.mollie.com/v2/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MOLLIE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
    }),
  });

  const customer = await response.json();

  const payment = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MOLLIE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { currency: "EUR", value: amount },
      customerId: customer.id,
      sequenceType: "first",
      description: "Maandelijkse donatie",
      redirectUrl: "https://clothed.nl/bedankt",
      webhookUrl: "https://clothed.nl/webhook",
      method: "ideal",
    }),
  });

  const paymentData = await payment.json();

  res.status(200).json({ url: paymentData._links.checkout.href });
}
