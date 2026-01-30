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

    // 2) startDate = 1 maand later (dynamisch per donor)
    const start = new Date();
    start.setMonth(start.getMonth() + 1);
    const startDate = start.toISOString().slice(0, 10);

    // 3) Alleen doorgaan als eerste betaling geslaagd is
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
            startDate: startDate,
          }),
        }
      );
    }

    return res.status(200).send("ok");
  } catch (e) {
    return res.status(500).send(e.message);
  }
}
