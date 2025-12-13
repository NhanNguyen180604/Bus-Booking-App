# Repository link
[https://github.com/NhanNguyen180604/Bus-Booking-App](https://github.com/NhanNguyen180604/Bus-Booking-App)
# Set up the project for local
- Go to ```apps/backend```, create a ```.env``` file as instructed inside the ```.env.example``` file.
- Go to ```apps/frontend```, create a ```.env``` file as instructed inside the ```.env.example``` file.
- At the root directory, run ```pnpm install```.
- The turbo documentation highly recommendeds installing turbo globally.

# Stripe Integration
- Sign up for a Stripe account and access your dashboard.
- Get the secret and put it inside the backend's ```.env```
- Get the public key and put it inside the frontend's ```.env```
- Use <b>Stripe CLI</b> to connect forward the webhooks event to your ```http://localhost:8000/webhooks/stripe```, you must put the generated webhook secret inside the backend's ```.env```
- On the payment page, type ```4242 4242 4242 4242``` for the card number, ```04/30``` or any year after the current year for the expiry date, and ```242``` for the CVV. This is Stripe's test card number and will guarantee successful payment.

# Run locally
- At the root directory, run ```pnpm dev```.
- Go to [http://localhost:3000](http://localhost:3000) for the frontend.
- The backend is on [http://localhost:8000](http://localhost:8000).

# Build locally
- At the root directory, run ```pnpm build```.

# Authentication flow
The backend generates an <b>access token</b> and a <b>refresh token</b> (if "Remember Me" is checked).  
The <b>tokens</b> are stored inside <b>HTML only signed cookies</b> for the client.  
In the backend, the refresh tokens are stored in the database.  
The ```jwt.middleware.ts``` always checks for cookies inside the incoming requests.
- If they have <b>no access token</b> and a <b>valid refresh token</b>, the backend automatically generates a new access token.
- If they have <b>no access token</b> and an <b>invalid refresh token</b> (or expired/not found), the backend clears all of their token cookies, as well as deleting the refresh token inside the database if it exists.

# Deployment
- Frontend: [https://bus-booking-app-frontend.vercel.app/](https://bus-booking-app-frontend.vercel.app/)
- Backend: [https://bus-booking-app-c67q.onrender.com](https://bus-booking-app-c67q.onrender.com)