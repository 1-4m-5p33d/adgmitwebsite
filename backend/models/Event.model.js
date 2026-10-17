import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    imageUrl: {
        type: String,
        default: "",
    },
    registrationUrl: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["upcoming", "completed", "cancelled"],
        default: "upcoming",
    },
}, {timestamps: true});

const Event = mongoose.model("Event", eventSchema);

export default Event;
