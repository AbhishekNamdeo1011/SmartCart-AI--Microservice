import app from "../src/app.js";
import dotenv from 'dotenv';
dotenv.config();





app.listen(3006, () => {
    console.log("Notification service is running on port 3006");
});