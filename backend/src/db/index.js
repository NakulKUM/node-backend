import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB= async ()=> {
   try{
     const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
     console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
   }catch(error){
      console.log('MongoDB connection error', error);
      process.exit(1);
   }
}

export default connectDB;

// const connectionInstance = await mongoose.connect(
//          'mongodb+srv://nakulrajput301_db_user:Nakul123@cluster0.pi6h0z6.mongodb.net/nodedb?retryWrites=true&w=majority&appName=Cluster0/'
//       );