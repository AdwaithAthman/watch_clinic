
# Watch Clinic

Watch Clinic is an ecommerce website for buying and selling watches. It is built with Node.js, HBS (Handlebars), and MongoDB.
<br>
Hosted in AWS. Used Nginx as proxy server and also as a load balancer.
<br>
<a href="https://watchclinic.tech" target="_blank" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-align: center; text-decoration: none; border-radius: 4px; font-size: 16px; margin: 2px 2px; cursor: pointer;"><strong>Link</strong></a>



![Logo](https://i.imgur.com/ChAQSDQ.png)


## Installation

To install Watch Clinic, follow these steps:

1. Clone this repository
```bash
 git clone https://github.com/AdwaithAthman/watch_clinic.git
```
2. Install dependencies
```bash
install npm
```
3. Set environment variables
- `AUTH_TOKEN` : The Authentication Token from Twilio to authenticate your API requests.

- `ACCOUNT_SID` : The Account SID is used to authenticate your API requests and to identify your account when you interact with Twilio.

- `SERVICE_SID` : The Service SID is a unique identifier for a specific messaging service that you have created in your Twilio account.

- `MONGO_URL` : The URL for your MongoDB database

- `CLIENT_ID_PAYPAL` : The Client ID is a publicly available identifier that identifies your application to PayPal.

- `CLIENT_SECRET_PAYPAL` : The Client Secret is a secret key that is known only to your application and PayPal.

- `KEY_ID_RZP` : Key ID is a public identifier that uniquely identifies your account in Razorpay.

- `KEY_SECRET_RZP` : Key Secret is a private key that is used to sign API requests

4. Start the server
```bash
npm start
```


    
## Features

**User side**:
- User Registration and the Login with validation
- Wallet
- Wallet Hisory 
- User Login using OTP
- Order Management
- Cart Management
- Wishlist Management
- Address Management
- Coupon Codes 
- Offer Management
- Razorpay
- Paypal
- Product searching
- Product zoom

**Admin side**:
- Order Statistics
- Product Management
- Order Management
- Image cropping
- Category Management
- Offers Management
- Coupon Management
- Product Offer
- Category Offer
- User Management
- Banner Management
- Sales Report and download options



## Technologies

- **Node.js** is used to build the server-side application logic
- **HBS** (Handlebars) for templating
- **MongoDB** for data storage
- **Express** for server-side routing and middleware
- **Razorpay** and **Paypal** for payment processing
- **Bootstrap** for front-end styling

## Contributing

Contributions are always welcome!

1. Fork this repository.
2. Create a branch: `git checkout -b your-feature`
3. Make your changes and commit them: `git commit -m 'Add your feature'`
4. Push your changes to your forked repository: `git push origin your-feature`
5. Open a pull request from your branch in the forked repository to the original repository.

