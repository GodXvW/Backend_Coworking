const Reservation = require('../models/Reservation');
const Coworking = require('../models/Coworking')
const sendEmail = require("../function/sendEmail");
const User = require("../models/User");

exports.getReservations = async (req, res, next) => {
    let query;
    //General users can see only their Reservations
    if (req.user.role !== 'admin') {
        query = Reservation.find({ user: req.user.id }).populate({
            path: 'coworking',
            select: 'name province tel'
        });
    } else { //If you are an admin, you can see all
        if (req.params.coworkingId) {
            console.log(req.params.coworkingId);
            query = Reservation.find({
                coworking: req.params.coworkingId
            }).populate({
                path: 'coworking',
                select: 'name province tel'
            });
        } else query = Reservation.find().populate({
            path: 'coworking',
            select: 'name province tel'
        });

    }
    try {
        const reservations = await query;
        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            message: "Cannot find Reservation"
        });
    }
};

exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'coworking',
            select: 'name description tel'
        });
        if (!Reservation) {
            return res.status(404).json({
                success: false,
                message: `No reservation with the id of ${req.params.id}`
            });
        }
        res.status(200).json({
            succes: true,
            data: reservation
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Cannot find Reservation'
        });
    }
}

//@route POST /api/v1/coworkings/:coworkingId/Reservation
exports.addReservation = async (req, res, next) => {
    try {
        req.body.coworking = req.params.coworkingId;
        const coworking = await Coworking.findById(req.params.coworkingId);
        if (!coworking) {
            return res.status(404).json({
                success: false,
                message: `No coworking with the id of ${req.params.coworkingId}`
            });
        }
        //add user Id to req.body
        req.body.user = req.user.id;

        //Check for existed Reservation
        const existedReservation = await Reservation.find({ user: req.user.id });


        //If the user is not an admin, they can only create 3 Reservation,
        if (existedReservation.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 Reservations`
            });
        }
        const reservation = await Reservation.create(req.body);
        const user = await User.findById(req.user.id);
        const timeSlot = req.body.resvTime.split(" ")[1]; // Extract "HH:mm-HH:mm"

        // Send confirmation email
        await sendEmail(
            user.email,
            "Booking Confirmation: Your Coworking Space Reservation",
            `Dear ${user.name},\n\nThank you for choosing ${reservation.coworking.name}. We are pleased to confirm your reservation. Below are the details of your booking:\n\n
            Location: ${reservation.coworking.address}\n
            Operating Hours: ${timeSlot}\n\n
            Please present your booking reference number upon arrival. If you need to make any changes to your reservation or require further assistance, feel free to contact us at ${reservation.coworking.telephone}.\n\nWe look forward to welcoming you to our co-working space.
             \n\nBest regards,\nCoworking Space Team`
        );

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Cannot create Reservation'
        });
    }
}
//@route PUT /api/v1/reservations/:id
exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: `No reservation with the id of ${req.params.id}`
            });
        }
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this reservation`
            });
        }
        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        const user = await User.findById(req.user.id);

        await sendEmail(
            user.email,
            "Update: Your Co-Working Space Booking Time",
            `Dear ${user.name},\n\nWe would like to inform you that the time for your reserved co-working space has been updated. Please find the revised booking details below:\n\n
            Location: ${reservation.coworking.address}\n
            Operating Hours: ${reservation.coworking.open_close_time}\n
            New Time: ${reservation.coworking.updatedAt}\n\n
            If you have any questions or require further assistance, please do not hesitate to contact us at${reservation.coworking.telephone}.\n\nWe appreciate your understanding and look forward to welcoming you soon.
             \n\nBest regards,\nCoworking Space Team`
        );

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Cannot update Reservation'
        });
    }
}

//@route DELETE /api/v1/Reservations/:id
exports.deleteReservation = async (req, res, next) => {
    try {
        console.log("Received DELETE request for reservation:", req.params.id);
        console.log("User making request:", req.user.id, "Role:", req.user.role);

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            console.log("Reservation not found.");
            return res.status(404).json({
                success: false,
                message: `No reservation with the id of ${req.params.id}`
            });
        }

        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log(`User ${req.user.id} is not authorized to delete this reservation.`);
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this reservation`
            });
        }

        await reservation.deleteOne();
        console.log("Reservation deleted successfully.");

        const user = await User.findById(reservation.user);
        await sendEmail(
            user.email,
            "Cancellation: Your Coworking Space Reservation",
            `Dear ${user.name},\n\nWe regret to inform you that your co-working space reservation has been successfully canceled.`
        );

        return res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log("Error deleting reservation:", error);
        return res.status(500).json({
            success: false,
            message: "Cannot delete reservation"
        });
    }
};

