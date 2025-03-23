const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const cors = require("cors");
const mongoSanitize = require('express-mongo-sanitize');
const reviewRoutes = require("./routes/review");
//Load env vars
dotenv.config({ path: './config/config.env' });

//Connect to database
connectDB();

const app = express();
// app.use(cors());
// app.use(cors({ origin: "https://coworkings.vercel.app", credentials: true }));
// require("./function/cronReminder"); // Load the cron job

//add body parser
app.use(express.json());

app.use(mongoSanitize());
app.use(helmet());
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
    windowsMs: 10 * 60 * 1000,
    max: 100
})
app.use(limiter);

//Cookie parser
app.use(cookieParser());

//Route files
const coworkings = require('./routes/coworkings');
const auth = require('./routes/auth');
const reservations = require('./routes/reservations');

//Mount routers
app.use('/api/v1/coworkings', coworkings);
app.use('/api/v1/auth', auth);
app.use('/api/v1/reservations', reservations);
app.use("/api/v1/coworkings", reviewRoutes);
app.use("/api/v1/reviews", reviewRoutes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in', process.env.NODE_ENV, 'mode on port', PORT));

//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    server.close(() => process.exit(1));
});
