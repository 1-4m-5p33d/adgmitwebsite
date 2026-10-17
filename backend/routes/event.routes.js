import express from "express"
import Event from "../models/Event.model.js"

const router = express.Router();

router.get("/", async(req, res) => {
    try {
        const events = await Event.find().sort({date: 1});
        res.status(200).json({
            success: true,
            count: events.length,
            data: events,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch Events!",
        });
    }
});

router.post("/", async(req, res) => {
    try {
        const {title, description, date, location, imageUrl, registrationUrl, status} = req.body;
        const event = await Event.create({title, description, date, location, imageUrl, registrationUrl, status});
        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (err) {
        if (err.name === "ValidationError" || err.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid event data",
                error: err.message,
            });
        }

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Failed to create event!"
        });
    }
});

const isValidId = (id) => /^[a-f\d]{24}$/i.test(id);

router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID"
            });
        }

        const event = await Event.findById(id);
        if(!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Event!"
        });
    }
});

router.patch("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID",
            });
        }

        const allowed = ["title", "description", "date", "location", "imageUrl", "registrationUrl", "status"];
        const updates = {};
        for(const f of allowed) {
            if(Object.hasOwn(req.body, f)) {
                updates[f] = req.body[f];
            }
        }

        if(Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid update fields provided",
            });
        }

        const event = await Event.findByIdAndUpdate(id, 
            {$set: updates},
            {new: true, runValidators: true}
        );

        if(!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (err) {
        if(err.name === "ValidationError" || err.name === "CastError") {
            return res.json(400).json({
                success: false,
                message: "Invalud event data!",
                error: err.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update event!"
        });
    }
});

router.delete("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID",
            });
        }

        const event = await Event.findByIdAndDelete(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Event deleted successfully",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to delete event!"
        });
    }
}); 

export default router;