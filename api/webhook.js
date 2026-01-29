export default async function handler(req, res) {
  try {
    const paymentId = req.body?.id || req.query?.id;
    if (!paymentId) return res.status(400).send("missing id");

    // 1) Betaling ophalen
    const paymentRes = await fetch(
      `https://api.mollie.com/v2/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${process.env.MOLLIE_KEY}` },
      }
    );
    const payment = await paymentRes.json();

    // 2) Alleen doorgaan als eerste betaling geslaagd is
    if (payment.status === "paid" && payment.sequenceType === "first") {
      await fetch(
        `https://api.mollie.com/v2/customers/${payment.customerId}/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.MOLLIE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: payment.amount,
            interval: "1 month",
            description: "Maandelijkse donatie",
          }),
        }
      );
    }

    res.status(200).send("ok");
  } catch (e) {
    res.status(500).send(e.message);
  }
}
