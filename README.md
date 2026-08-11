# NodoTech — Servicios de Informática, Redes y Sistemas

Página de servicios de TI (negocio inventado para esta demo) con
checkout real vía PayPal: 3 planes (Básico, Pro, Enterprise), pago único.

## 1. Requisitos
- Node.js 18 o superior (usa `fetch` nativo, sin dependencias extra de red).
- Una cuenta PayPal Business ya creada.

## 2. Obtener tus credenciales de PayPal

1. Ve a https://developer.paypal.com/dashboard/applications e inicia
   sesión con tu cuenta de PayPal Business.
2. En la pestaña **Sandbox**, click en "Create App" (o usa la app
   "Default Application" que PayPal crea automáticamente).
3. Copia el **Client ID** y el **Secret** — los vas a necesitar en dos
   lugares distintos (ver siguiente paso).

## 3. Configurar el proyecto

```bash
npm install
cp .env.example .env
```

Completa `.env` con tu `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` de
**Sandbox** (para probar sin dinero real).

Luego, en `public/index.html`, busca esta línea al inicio del `<head>`
y reemplaza `YOUR_CLIENT_ID` por tu mismo Client ID de Sandbox:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD&components=buttons"></script>
```

Sí, el Client ID va en dos lugares: en el `.env` (para que el backend
cree y capture órdenes) y en el `index.html` (para que el botón de
PayPal se renderice en el navegador). Son el mismo valor.

## 4. Probar en local

```bash
npm run dev
```

Abre `http://localhost:4242`. A diferencia de Apple Pay con Stripe, el
checkout de PayPal en modo Sandbox **sí funciona en localhost, sin
dominio ni HTTPS** — puedes probarlo ahora mismo.

Para pagar en la prueba, usa una cuenta de comprador de Sandbox: ve a
developer.paypal.com → Sandbox → Accounts, ahí PayPal ya te genera una
cuenta de comprador de prueba con "dinero" ficticio para completar el
pago sin gastar nada real.

## 5. Sobre Apple Pay dentro de PayPal

Apple Pay puede aparecer automáticamente como opción dentro del botón
de PayPal si:
- El comprador navega desde Safari en iPhone/iPad/Mac
- Tiene una tarjeta compatible cargada en su Apple Wallet

No es un botón separado garantizado como en Stripe — es una opción que
PayPal decide mostrar según el dispositivo. No requiere configuración
adicional de tu parte más allá de tener el checkout de PayPal andando.

## 6. Pasar a modo real (Live)

Cuando quieras cobrar de verdad:
1. En el dashboard de PayPal, cambia a la pestaña **Live** y repite el
   paso 2 para obtener tus credenciales de producción.
2. Actualiza `.env`:
   - `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` → los de Live
   - `PAYPAL_BASE_URL` → `https://api-m.paypal.com`
3. Actualiza el Client ID en `index.html` por el de Live.
4. Despliega el proyecto en un servidor real (Render, Railway, etc.)
   con esas variables de entorno configuradas.

## 7. Ajustar los planes

Los 3 planes (nombre y precio) están definidos en dos lugares que
deben coincidir exactamente:
- `public/index.html` — en los atributos `data-name` y `data-price`
  de cada `.plan-card`
- `server.js` — en el objeto `PLANS`

Si cambias un precio, cámbialo en ambos archivos.

## Seguridad
- `PAYPAL_CLIENT_SECRET` nunca va en el frontend ni en un repo público.
- El precio final se valida contra la lista `PLANS` en `server.js`,
  nunca confíes en un monto que llegue directo del navegador.
