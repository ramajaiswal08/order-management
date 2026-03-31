const orderManager = require('../manager/orderManager');


//CREATE ORDER
exports.createOrder = async (req, res, next) => {
  try {
    const result = await orderManager.createOrder({
      userId: req.user.id,   // from auth middleware
      items: req.body.items,
      shippingAddressId: req.body.shippingAddressId,
      paymentMode: req.body.paymentMode
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};


//  GET USER ORDERS
exports.getUserOrders = async (req, res, next) => {
  try {
    const result = await orderManager.getUserOrders(
      req.user.id,
      req.query
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};


//GET ORDER DETAILS
exports.getOrderDetails = async (req, res, next) => {
  try {
    const result = await orderManager.getOrderDetails(
      req.params.orderId,
      req.user.id
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};


//ADMIN: GET ALL ORDERS
exports.getAllOrders = async (req, res, next) => {
  try {
    const result = await orderManager.getAllOrders(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};


//UPDATE STATUS
exports.updateStatus = async (req, res, next) => {
  try {
    const result = await orderManager.updateStatus(
      req.params.id,
      req.body.status
    );

    res.json({ status: result });
  } catch (err) {
    next(err);
  }
};


// ASSIGN SHIPPER
exports.assignShipper = async (req, res, next) => {
  try {
    await orderManager.assignShipper(
      req.params.id,
      req.body.shipperId
    );

    res.json({ message: 'Shipper assigned successfully' });
  } catch (err) {
    next(err);
  }
};