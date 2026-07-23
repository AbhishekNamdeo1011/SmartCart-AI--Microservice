import {body,validationResult} from "express-validator";
const respondwithValidationErrors =  (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        })
    }next()
}


const createOrderValidations = [
  body("shippingAddress.street")
  .isString()
  .withMessage("Street is required"),
  body("shippingAddress.city").isString().withMessage("City is required"),    
  body("shippingAddress.state").isString().withMessage("State is required"),
  // body("shippingAddress.zip").isString().withMessage("Zip code is required"),
  body("shippingAddress.pincode").isString().withMessage("Pincode is required"),
  body("shippingAddress.country").isString().withMessage("Country is required"),
  body("shippingAddress.isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
  respondwithValidationErrors
];

const updateAddressValidation = [
    body("shippingAddress.street")
        .isString()
        .notEmpty()
        .withMessage("Street is required"),
    body("shippingAddress.city")
        .isString()
        .notEmpty() 
        .withMessage("City is required"),
    body("shippingAddress.state")
        .isString()
        .notEmpty()
        .withMessage("State is required"),
    body("shippingAddress.pincode")
        .isString()
        .notEmpty()
        .withMessage("Pincode is required"),    
    body("shippingAddress.country")
        .isString()
        .notEmpty()
        .withMessage("Country is required"),
     body("shippingAddress.isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be a boolean"),

    respondwithValidationErrors,
];

export {createOrderValidations, updateAddressValidation};