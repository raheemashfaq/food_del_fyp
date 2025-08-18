import 'dotenv/config.js'
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import authRouter from "./routes/authRoute.js";
import chatRouter from './routes/chatRoute.js';


// chatbot
const apiKey = process.env.GEMINI_API_KEY;
 //app config
 const app = express()
 const port = process.env.PORT || 4000

 // middleware 
 app.use(express.json())
 app.use(cors())

 //DB connection
 connectDB();


 //api endpoints
app.use('/api/food',foodRouter)
app.use('/images',express.static('uploads'))
app.use('/api/user',userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/auth", authRouter)
app.use("/api/chat", chatRouter);

 app.get("/",(req,res)=>{
    res.send("API Working")
 })

app.listen(port,()=>{
    console.log(`server started on http://localhost:${port}`)
})
