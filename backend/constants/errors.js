const { SHIPPER } = require("./messages");

const ERRORS = {
    ADDRESS : {
        ADDRESS_NOT_FOUND: "Address not found",
        ADDRESS_REQUIRED_FIELDS: "line1, city and pincode are required"
    },
    AUTH :{
         REQUIRED_FIELDS: "All fields are required",
         USER_EXISTS: "User already exists",
         INVALID_CREDENTIALS: "Invalid credentials",
         USER_NOT_FOUND: "User not found"

    },
    ORDER : {
        INVALID_ORDER: "Invalid order data",
  ADDRESS_NOT_FOUND: "Address not found",
  ORDER_NOT_FOUND: "Order not found",
  STATUS_REQUIRED: "Status is required",
  INVALID_STATUS: "Invalid status",
  SHIPPER_NOT_FOUND: "Shipper not found",
  INSUFFICIENT_STOCK: "Insufficient stock"
    },
    SHIPPER: {
        SHIPPER_NOT_FOUND: "Shipper not found",
        REQUIRED_FIELDS: "Required fields are missing"
    }
  
};

module.exports = ERRORS;