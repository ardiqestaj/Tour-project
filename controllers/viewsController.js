const Tour = require('../models/tourModel');
const User = require('../models/userModel');
// const Booking = require('../models/BookingModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utilis/catchAsync');
const AppError = require('../utilis/appError');

exports.getOverview = catchAsync(async(req, res, next) => {
    // 1) Get tour data from Collection
    const tours = await Tour.find();
    // 2) Build template
    // 3) Render that template using tour data from 1

    res.status(200).render('overview', {
        title: 'All tours',
        tours,
    });
    next();
});

exports.getTour = catchAsync(async(req, res, next) => {
    // Get the data for the request Tour(including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }

    // 2) Build template
    // 3) Render template using data from 1)
    res.status(200).render('tour', {
        title: `${tour.name} tour`,
        tour,
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log in to your account',
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.getMyTours = catchAsync(async(req, res, next) => {
    // 1) Find All Bookings
    const allBooking = await Booking.find({ user: req.user.id });

    // 2) Find tours with the returned IDs
    const tourIDs = allBooking.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });
    res.status(200).render('overview', {
        title: 'My tours',
        tours
    })
})

exports.updateUserData = catchAsync(async(req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id, {
            name: req.body.name,
            email: req.body.email,
        }, {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser,
    });
});