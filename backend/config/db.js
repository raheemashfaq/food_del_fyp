import mongoose from "mongoose";

export const connectDB = async ()=>{
    // Use environment variable for database connection
    await mongoose.connect(`${process.env.MONGODB_URI}`).then(()=>console.log("DataBase Connected"));

}