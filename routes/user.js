var express = require('express');
const userController = require('../controllers/usersController');
const adminController = require('../controllers/adminController');
var router = express.Router();

const verifyLogin = (req, res, next) => {
    if(req.session.loggedIn){
      next()
    }
    else{
      res.redirect('/login')
    }
  }
  
router.get('/', userController.homeView);
router.get('/login',userController.loginGet); 
router.post('/login',userController.loginPost);
router.get('/logout',userController.logoutGet)
router.get('/signup', userController.signupGet);
router.post('/signup',userController.signupPost);
router.post('/get-otp',userController.getOtpPost);
router.post('/otp',userController.otpPost);
router.get('/profile', verifyLogin, userController.profileViewGet);
router.post('/edit-profile/:id',userController.editProfilePost);
router.get('/wallet-history', verifyLogin, userController.walletHistoryGet);
router.get('/profile-security',verifyLogin,userController.profileSecurityViewGet)
router.post('/change-password',verifyLogin, userController.passwordChangePost)
router.get('/shop', userController.shopGet)
router.get('/shop/search',userController.shopSearch)
router.get('/shop/search-results',userController.shopSearchResults)
router.get('/shop-category',userController.categoryShopGet)
router.get('/product',userController.productGet);

//wishlist
router.get('/wishlist',verifyLogin, userController.wishlistGet)
router.get('/add-to-wishlist/:id', verifyLogin, userController.addToWishlist);
router.get('/remove-from-wishlist/:id/:wishId', verifyLogin, userController.removeFromWishlist);
router.get('/remove-from-wishlist/:id', verifyLogin, userController.removeFromWishlist2);

router.get('/add-to-cart/:id', verifyLogin, userController.addToCart);
router.get('/cart', verifyLogin, userController.cartGet);
router.get('/remove-from-cart/:id', verifyLogin, userController.removeFromCart)
router.post('/change-product-quantity',userController.changeProductQuantity);
router.get('/checkout',verifyLogin, userController.checkoutGet)
router.post('/place-order',verifyLogin, userController.placeOrderPost)
router.get('/order',verifyLogin, userController.orderGet)
router.get('/order-cancel/:id',verifyLogin,userController.cancelOrderIdGet);
router.get('/order-return/:id',verifyLogin,userController.returnOrderIdGet);
router.get('/ordered-products',verifyLogin, userController.orderedProducts)
router.get('/order-success',verifyLogin,userController.orderSuccess)
router.post('/verify-payment', verifyLogin, userController.verifyPayment)

//error-page
router.get('/error',userController.errorPageGet)

//address 
router.patch('/save-address',verifyLogin,userController.saveAddressPatch);
router.get('/edit-address/:id', verifyLogin,userController.editAddressGet);
router.delete('/delete-address/:id',verifyLogin, userController.deleteAddress);
router.get('/add-address',verifyLogin, userController.addAddressGet);

//coupon
router.post('/coupon-apply',verifyLogin, userController.postApplyCoupon);

module.exports = router;
