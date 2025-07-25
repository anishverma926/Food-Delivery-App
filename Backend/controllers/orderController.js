import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

//placing user order for frontend
const placeOrder = async (req, res) => {

    const frontend_url = "https://food-delivery-website-ulq6.onrender.com";

    try {
        // Example: order creation logic
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address, 
            status: "Food Processing",
            payment: true,
        });

        // saving the data in DB
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "aud",
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }));

        // Add delivery fee
        line_items.push({
            price_data: {
                currency: "aud",
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: 2 * 100
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            line_items : line_items,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        });

        res.json({ success: true, session_url: session.url });
    } 
    catch (error) {
        console.error("PLACE ORDER ERROR:", error);
        res.json({ success: false, message: "Order failed" });
    }
};

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;

    try {
        if (success === true || success === "true") {
            // Mark order as paid
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Payment successful. Order marked as paid." });
        }
        else {
            // Delete order if payment failed
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment failed. Order deleted." });
        }
    }
    catch (error) {
        console.error("Error verifying order:", error);
        res.status(500).json({ success: false, message: "Internal server error during order verification." });
    }
};

// user order for frontend
const userOrders = async (req, res) => {
    try {
        // console.log("Fetching orders for userId:", req.userId); // Debug

        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders });
    } 
    catch (error) {
        console.error("Error fetching user orders:", error);
        res.json({ success: false, message: "Internal server error during order" });
    }
}

// Listing orders for admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// api for updating order status
const updateStatus = async (req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status })
        res.json({ success: true, message: "Status Updated" })
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus }
