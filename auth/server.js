import dotenv from "dotenv"
import  app from "./src/app.js"
import  cookieParsar from  "cookie-parser"
import  connectToDb   from "./src/db/db.js"
dotenv.config()

connectToDb();
app.listen(3000,()=>{
    console.log("Server is running on port 3000");
    
}) 