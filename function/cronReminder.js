const cron = require("node-cron");
const Reservation = require("../models/Reservation");
const sendEmail = require("./sendEmail");
const moment = require("moment");

// ✅ Function for Start-Time Reminder (Fixed)
async function sendStartTimeReminders() {
    const oneHourLater = moment().add(1, "hour");
    console.log(`🕒 Checking for START reminders at: ${oneHourLater.format("YYYY-MM-DD HH:mm")}`);

    const upcomingReservations = await Reservation.find({
        resvTime: {
            $regex: `^${oneHourLater.format("YYYY-MM-DD")} ${oneHourLater.format("HH:mm")}-\\d{2}:\\d{2}$`
        },
        reminderSent: false
    }).populate("user coworking");

    for (const reservation of upcomingReservations) {
        if (reservation.user && reservation.user.email) {
            const timeSlot = reservation.resvTime.split(" ")[1]; // Extract "HH:mm-HH:mm"

            try {
                await Reservation.findByIdAndUpdate(reservation._id, { reminderSent: true });

                await sendEmail(
                    reservation.user.email,
                    "Reminder: Your Coworking Space Reservation",
                    `Dear ${reservation.user.name},\n\nYour reserved co-working space starts in 1 hour.\n\n
                     📍 Location: ${reservation.coworking.address}\n
                     🕒 Time Slot: ${timeSlot}\n
                     📞 Contact: ${reservation.coworking.telephone}\n\n
                     See you soon!\n\nBest,\nCoworking Space Team`
                );

                console.log(`📩 Reminder sent to ${reservation.user.email}`);

            } catch (error) {
                console.error("❌ Error sending start reminder:", error);
            }
        }
    }
}

// ✅ Function for End-Time Reminder (Fixed)
async function sendEndTimeReminders() {
    const now = moment();
    console.log(`🕒 Checking for END reminders at: ${now.format("YYYY-MM-DD HH:mm")}`);

    const endedReservations = await Reservation.find({
        resvTime: {
            $regex: `^${now.format("YYYY-MM-DD")} \\d{2}:\\d{2}-${now.format("HH:mm")}$`
        },
        reminderEndSent: false
    }).populate("user coworking");

    for (const reservation of endedReservations) {
        if (reservation.user && reservation.user.email) {
            try {
                await Reservation.findByIdAndUpdate(reservation._id, { reminderEndSent: true });

                await sendEmail(
                    reservation.user.email,
                    "Thank You for Using Our Coworking Space",
                    `Dear ${reservation.user.name},\n\nWe hope you enjoyed your time at ${reservation.coworking.name}!\n\n
                     Your session from ${reservation.resvTime.split(" ")[1]} has now ended.\n
                     Please consider leaving a review.\n\n
                     Thank you for choosing us!\n\nBest,\nCoworking Space Team`
                );

                console.log(`📩 End reminder sent to ${reservation.user.email}`);

            } catch (error) {
                console.error("❌ Error sending end reminder:", error);
            }
        }
    }
}

// ✅ Schedule Cron Jobs
cron.schedule("* * * * *", async () => {
    await sendStartTimeReminders();
});
cron.schedule("* * * * *", async () => {
    await sendEndTimeReminders();
});

console.log("⏰ Reminder email job is running...");
