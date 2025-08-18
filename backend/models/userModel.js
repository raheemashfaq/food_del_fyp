import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        require:true
    },
    cartData:{
        type:Object,
        default:{}
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: ''
    }

},{minimize:false})

const userModel = mongoose.models.user || mongoose.model("user",userSchema);
export default userModel;