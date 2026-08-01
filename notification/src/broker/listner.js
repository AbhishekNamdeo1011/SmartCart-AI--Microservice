import { subscribeToQueue } from "./broker.js"; 
import  {sendEmail} from "../email.js"
export default  function (){
subscribeToQueue("AUTH_NOTIFICATION.USER_CREATED", async (data) => {
const emailHTMLTemplate = `
<h1>Welcome to our Services!</h1>
<p>Dear ${data.fullName.firstName} ${data.fullName.lastName|| ""},</p>
<p>Thank you for registering with us. We're excited to have you on board!</p>
<p>Best regards,<br/>The Team</p>`
await sendEmail(data.email, "Welcome to our Services!", `Dear ${data.fullName.firstName} ${data.fullName.lastName|| ""},\n\nThank you for registering with us. We're excited to have you on board!\n\nBest regards,\nThe Team`, emailHTMLTemplate);

});

subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Payment Initiated</h1>
    <p>Dear ${data.username},</p>   
    <p>Your payment for order ${data.orderId} has been initiated. The amount of ${data.amount} ${data.currency} is being processed.</p>
    <p>We will notify you once the payment is completed.</p>
    <p>Best regards,<br/>The Team</p>`;
    await sendEmail(data.email, "Payment Initiated", `Dear ${data.username},\n\nYour payment for order ${data.orderId} has been initiated. The amount of ${data.amount} ${data.currency} is being processed.\n\nWe will notify you once the payment is completed.\n\nBest regards,\nThe Team`, emailHTMLTemplate);
}
);

subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Payment Successful!</h1>
    <p>Dear ${data.username},</p>
    <p>Your payment for order ${data.orderId} has been successfully processed. The amount of ${data.amount} ${data.currency} has been received.</p>
    <p>Thank you for your purchase!</p>
    <p>Best regards,<br/>The Team</p>`;
    await sendEmail(data.email, "Payment Successful!", `Dear ${data.username},\n\nYour payment for order ${data.orderId} has been successfully processed. The amount of ${data.amount} ${data.currency} has been received.\n\nThank you for your purchase!\n\nBest regards,\nThe Team`, emailHTMLTemplate);
});
subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Payment Failed</h1>
    <p>Dear ${data.username},</p>
    <p>We regret to inform you that your payment for order ${data.orderId} has failed. Please try again or contact support for assistance.</p>
    <p>Best regards,<br/>The Team</p>`;
    await sendEmail(data.email, "Payment Failed", `Dear ${data.username},\n\nWe regret to inform you that your payment for order ${data.orderId} has failed. Please try again or contact support for assistance.\n\nBest regards,\nThe Team`, emailHTMLTemplate);
});
subscribeToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Product Created</h1>
    <p>Dear ${data.username},</p>
    <p>Your product with ID ${data.productId} has been successfully created and is now available for customers to view and purchase.</p>
    <p>Thank you for listing your product with us!</p>
    <p>Best regards,<br/>The Team</p>`;
    await sendEmail(data.email, "Product Created", `Dear ${data.username},\n\nYour product with ID ${data.productId} has been successfully created and is now available for customers to view and purchase.\n\nThank you for listing your product with us!\n\nBest regards,\nThe Team`, emailHTMLTemplate);    
});
}