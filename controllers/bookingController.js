const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel')
const catchAsync = require('../utilis/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async(req, res, next) => {
    // Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        mode: 'payment',
        line_items: [{
            quantity: 1,
            price_data: {
                currency: 'usd',
                unit_amount: tour.price * 100,
                product_data: {
                    name: tour.name,
                    description: tour.summary, //description here
                    images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                },
            },
        }, ],
    });

    // Create session and response
    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createBookingCheckout = catchAsync(async(req, res, next) => {
    // This is only TEMPORARY, because it's UNSECURED: everyone can make booking without paying

    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next()
    await Booking.create({ tour, user, price })

    res.redirect(req.originalUrl.split('?')[0])
        // next()
})