var express = require('express');
const adminController = require('../controllers/adminController');
// var adminHelpers = require('../helpers/admin-helpers')
var router = express.Router();

//////////////////////////////// Check Admin Logged In //////////////////////////////////
const verifyLoginAdmin = (req, res, next) => {
    if (req.session.loggedIn) {
      next()
    } else {
      res.redirect('/admin')
    }
  }

router.get('/', adminController.adminloginGet);
router.post('/', adminController.adminloginPost);
router.get('/admin-logout', adminController.adminLogout);
router.get('/admin-dashboard',verifyLoginAdmin, adminController.adminDashboardGet);
router.get('/admin-dashboard/day', verifyLoginAdmin, adminController.adminDashboardGetday);
router.post('/admin-dashboard/graphdata', verifyLoginAdmin, adminController.adminDashboardPostDataGraph);    
router.get('/admin-user-management', verifyLoginAdmin, adminController.adminUserManagement);
router.get('/block-status', verifyLoginAdmin, adminController.blockStatus);
router.get('/admin-product-management', verifyLoginAdmin, adminController.adminProductManagement);
router.get('/admin-add-product', verifyLoginAdmin, adminController.adminAddProductGet);
router.post('/admin-add-product', verifyLoginAdmin, adminController.adminAddProductPost);
router.get('/admin-edit-product/:id', verifyLoginAdmin, adminController.adminEditProductGet);
router.post('/admin-edit-product', verifyLoginAdmin, adminController.adminEditProductPost);
router.get('/admin-delete-product/:id', verifyLoginAdmin, adminController.adminDeleteProduct);
router.get('/admin-category-management', verifyLoginAdmin, adminController.adminCategoryManagement);
router.get('/admin-add-category', verifyLoginAdmin, adminController.adminAddCategoryGet);
router.post('/admin-add-category', verifyLoginAdmin, adminController.adminAddCategoryPost);
router.get('/admin-delete-category/:id', verifyLoginAdmin, adminController.adminDeleteCategory)
router.get('/admin-edit-category/:id', verifyLoginAdmin, adminController.adminEditCategoryGet);
router.post('/admin-edit-category/:id', verifyLoginAdmin, adminController.adminEditCategoryPost);
router.get('/admin-order-management', verifyLoginAdmin, adminController.adminOrderManagementGet);
router.get('/order-details/:id', verifyLoginAdmin, adminController.orderViewDetailsGet);
router.post('/edit-status/:id', verifyLoginAdmin, adminController.editStatusPost)
router.get('/banner-management', verifyLoginAdmin, adminController.bannerManagementGet)
router.get('/add-head-banner', verifyLoginAdmin, adminController.headBannerGet)
router.post('/add-head-banner', verifyLoginAdmin, adminController.headBannerPost)
router.get('/edit-head-banner/:id', verifyLoginAdmin, adminController.editHeadBannerGet)
router.post('/edit-head-banner/:id', verifyLoginAdmin, adminController.editHeadBannerPost)
router.delete('/delete-head-banner/:id', verifyLoginAdmin, adminController.deleteHeadBanner)
router.get('/add-exclusive-deal', verifyLoginAdmin, adminController.addExclusiveDealGet)
router.post('/add-exclusive-deal', verifyLoginAdmin, adminController.addExclusiveDealPost)
router.get('/edit-exclusive-deal/:id', verifyLoginAdmin, adminController.editExclusiveDealGet)
router.post('/edit-exclusive-deal/:id', verifyLoginAdmin, adminController.editExclusiveDealPost)
router.delete('/delete-exclusive-deal/:id', verifyLoginAdmin, adminController.deleteExclusiveDeal)

//coupon
router.get('/list-coupon', verifyLoginAdmin,adminController.getlistCoupon);
router.get('/add-coupon', verifyLoginAdmin, adminController.getAddCoupon);
router.post('/add-coupon', verifyLoginAdmin, adminController.postAddCoupon)
router.delete('/deleteCoupon', verifyLoginAdmin, adminController.DeleteCouponDelete);

// category offers
router.get('/category-offer',verifyLoginAdmin, adminController.getCategoryOffer)
router.get('/category-add-offer',verifyLoginAdmin, adminController.getCategoryAddOffer)
router.post('/category-add-offer', verifyLoginAdmin, adminController.postCategoryAddOffer)
router.get('/category-edit-offer/:id',verifyLoginAdmin,adminController.getEditCategoryOffer)
router.post('/category-edit-offer/:id',verifyLoginAdmin,adminController.postEditCategoryOffer)
router.get('/delete-category-offer/:id', verifyLoginAdmin, adminController.deleteCategoryOffer)

// product offers
router.get('/product-offer', verifyLoginAdmin, adminController.getProductOffer)
router.get('/product-add-offer', verifyLoginAdmin, adminController.getProductAddOffer)
router.post('/product-add-offer', verifyLoginAdmin, adminController.postProductAddOffer)
router.get('/product-edit-offer/:id', verifyLoginAdmin, adminController.getProductOfferEdit)
router.post('/product-edit-offer/:id', verifyLoginAdmin, adminController.postProductOfferEdit)
router.get('/delete-product-offer/:id', verifyLoginAdmin, adminController.deleteProductOffer)

//sales-report
router.get('/sales-report', verifyLoginAdmin, adminController.getSalesReport)

module.exports = router;
