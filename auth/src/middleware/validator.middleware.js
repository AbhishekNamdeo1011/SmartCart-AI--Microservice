import {body,validationResult} from "express-validator";
const respondwithValidationErrors =  (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        })
    }next()
}

const registerUserValidations = [
    body("username")
    .isString()
    .isLength({min:3})
    .withMessage("Username must be at least 3 characters long"),
    body("email")
    .isEmail()
    .withMessage("Invalid email address"),
    body("password")
    .isLength({min:6})
    .withMessage("Password must be at least 6 characters long"),
    body("fullName.firstName")
    .isString()
    .isLength({min:2, max:100})
    .withMessage("First name must be between 2 and 100 characters long"),
    body("fullName.lastName")
    .isString()
    .isLength({min:2, max:100})
    .withMessage("Last name must be between 2 and 100 characters long"),
    body("role")
    .isString()
    .isIn(["user", "seller"])
    .withMessage("Role must be either user or seller"),

respondwithValidationErrors
]

const loginUserValidations = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address"),

  body("username")
    .optional()
    .isString()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  // 🔥 CUSTOM VALIDATION (VERY IMPORTANT)
  body().custom((value) => {
    if (!value.email && !value.username) {
      throw new Error("Email or username is required");
    }
    return true;
  }),

  respondwithValidationErrors
];
const addAddressValidations = [
  body("street").isString().withMessage("Street is required"),
  body("city").isString().withMessage("City is required"),    
  body("state").isString().withMessage("State is required"),
  // body("zip").isString().withMessage("Zip code is required"),
  body("pincode").isString().withMessage("Pincode is required"),
  body("country").isString().withMessage("Country is required"),
  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
  respondwithValidationErrors
];


export{
    registerUserValidations,
    loginUserValidations,
    addAddressValidations
}