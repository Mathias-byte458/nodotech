// server.js
// Backend para cobrar los planes de NodoTech vía PayPal (Orders API v2).
// Usa fetch nativo de Node — requiere Node.js 18 o superior.

require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Sandbox mientras pruebas, cambia a 'https://api-m.paypal.com' en producción.
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

// -----------------------------------------------------------------------
// Planes válidos. El precio SIEMPRE se valida contra esta lista en el
// servidor — nunca confíes en el monto que te mande el navegador.
// -----------------------------------------------------------------------
const PLANS = {
  'Plan Básico — Diagnóstico de red': '89.00',
  'Plan Pro — Instalación + soporte mensual': '249.00',
  'Plan Enterprise — Infraestructura completa': '590.00',
};

// Pide un access token a PayPal usando tus credenciales de app.
async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo autenticar con PayPal: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

// El navegador llama aquí cuando el cliente hace clic en el botón de PayPal.
app.post('/create-order', async (req, res) => {
  try {
    const { plan } = req.body;
    const validPrice = PLANS[plan];

    if (!validPrice) {
      return res.status(400).json({ error: 'Plan no reconocido' });
    }

    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: plan,
            amount: {
              currency_code: 'USD',
              value: validPrice,
            },
          },
        ],
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error(orderData);
      return res.status(500).json({ error: 'No se pudo crear la orden en PayPal' });
    }

    res.json({ id: orderData.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// El navegador llama aquí después de que el cliente aprueba el pago en PayPal.
app.post('/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;
    const accessToken = await getAccessToken();

    const captureRes = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      console.error(captureData);
      return res.status(500).json({ error: 'No se pudo capturar el pago' });
    }

    const status = captureData.status;
    console.log(`✅ Orden ${orderID} — estado: ${status}`);
    // AQUÍ: guarda el pedido en tu base de datos, envía correo de
    // confirmación al cliente, notifica al equipo técnico, etc.

    res.json(captureData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
