export default async function handler(req, res) {
  try {
    const { amount, email, name } = req.query;

    if (!amount || !email || !name) {
      return res.status(400).json({ error: "Missing amount, email, or name" });
    }

    // 1) Customer aanmaken
    const customerRes = await fetch("https://api.mollie.com/v2/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MOLLIE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email }),
    });

    const customer = await customerRes.json();
    if (!customer.id) return res.status(400).json(customer);

    // 2) Eerste betaling (maakt mandaat mogelijk)
    const paymentRes = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MOLLIE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: Number(amount).toFixed(2) },
        description: `Maandelijkse donatie €${amount}`,
        method: "ideal",
        customerId: customer.id,
        sequenceType: "first",
        redirectUrl: "https://clothed-donaties.vercel.app/bedankt",
        webhookUrl: "https://clothed-donaties.vercel.app/api/webhook",
        metadata: {
          email,
          name,
          amount: Number(amount).toFixed(2),
        },
      }),
    });

    const payment = await paymentRes.json();
    const checkout = payment?._links?.checkout?.href;

    if (!checkout) return res.status(400).json(payment);

    // 3) Redirect naar Mollie checkout
    res.writeHead(302, { Location: checkout });
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
