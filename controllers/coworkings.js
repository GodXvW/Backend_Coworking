const Reservation = require('../models/Reservation');
const Coworking = require('../models/Coworking');

exports.getCoworkings = async (req, res, next) => {
    try {
        let query;
        //Copy req.query
        const reqQuery = { ...req.query };

        //Fields to exculde
        const removeFields = ['select', 'sort', 'page', 'limit'];

        //Loop over remove fields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);
        console.log(reqQuery);

        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        //finding resource
        query = Coworking.find(JSON.parse(queryStr)).populate('reservations');

        //Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }
        //Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt')
        }
        //Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Coworking.countDocuments();
        query = query.skip(startIndex).limit(limit);

        //Executing query
        const coworkings = await query;
        //Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            }
        }
        res.status(200).json({
            success: true,
            count: coworkings.length,
            pagination,
            data: coworkings
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

exports.getCoworking = async (req, res, next) => {
    try {
        const coworking = await Coworking.findById(req.params.id);
        if (!coworking) {
            return res.status(400).json({ success: false });
        }
        res.status(200).json({
            success: true,
            data: coworking
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

exports.createCoworking = async (req, res, next) => {
    const coworking = await Coworking.create(req.body);
    res.status(201).json({
        success: true,
        data: coworking
    });
};

exports.updateCoworking = async (req, res, next) => {
    try {
        const coworking = await Coworking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidator: true
        });
        if (!coworking) {
            return res.status(400).json({ success: false });
        }
        res.status(200).json({
            success: true,
            data: coworking
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

exports.deleteCoworking = async (req, res, next) => {
    try {
        const coworking = await Coworking.findById(req.params.id);
        if (!coworking) {
            return res.status(400).json({ success: false });
        }
        await Reservation.deleteMany({ coworking: req.params.id });
        await Coworking.deleteOne({ _id: req.params.id });
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};
