import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://anishverma09072004_db_user:Anish%40%23926%23%23@cluster0.ijmiz7d.mongodb.net/food-del?retryWrites=true&w=majority&appName=Cluster0")
        
        console.log("✅ Connected to MongoDB - FoodDel");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};
