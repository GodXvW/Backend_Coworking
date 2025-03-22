const mongoose = require('mongoose');


const CoworkingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    telephone: {
        type: String
    },
    open_close_time: {
        type: String,
        required: [true, 'Please add a region']
    },
    picture: {
        type: String,
    },
    averageRating: {
        type: Number,
        default: 0
    }
}, {

    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
//Reverse populate with virtuals
CoworkingSchema.virtual('reservations', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'coworking',
    justOne: false

});

module.exports = mongoose.model('Coworking', CoworkingSchema);