const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
    res.status(statusCode).cookie('token', token, options).json({
        succes: true,
        token
    })
}


exports.logout = async (req, res, next) => {
    let token;

    // Check if token exists in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // Extract token from Bearer header
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'You are not logged in' });
    }

    try {
        // Verify the token (check if it's valid)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the token is valid and the user exists in the database
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found or session expired' });
        }

        // Clear the token from cookies
        res.cookie('token', '', {
            expires: new Date(0),  // Expire the cookie immediately
            httpOnly: true,         // Prevent access to cookie via JavaScript
        });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (err) {
        console.error(err.stack);
        return res.status(401).json({ success: false, message: 'Invalid token or session expired' });
    }
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        const user = await User.create({
            name,
            email,
            password,
            role
        });
        // const token = user.getSignedJwtToken();
        // res.status(200).json({ success: true, token });
        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false });
        console.log(err.stack);
    }

};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ succes: false, msg: 'Please provide an email and password' });
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ success: false, msg: 'Invalid credentials' });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ succes: false, msg: 'Invalid credentials' });
        }
        // const token = user.getSignedJwtToken();
        // res.status(200).json({ success: true, token });
        sendTokenResponse(user, 200, res);
    } catch (err) {
        return res.status(400).json({
            success: true,
            msg: 'Cannot convert email or password to string'
        });
    }
}

exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: req.user
    });
}

//@route GET /api/v1/auth/logout
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        data: {}
    });
}