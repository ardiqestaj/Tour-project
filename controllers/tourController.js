const Tour = require('./../models/tourModel');
// Catch async function
const catchAsync = require('./../utilis/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utilis/appError');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

// Get all tours
exports.getAllTours = factory.getAll(Tour);
// Get specific tour
// Reviews here is for populate
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// Create Tour
// This is fn function
exports.createTour = factory.createOne(Tour);
// Update Tour
exports.updateTour = factory.updateOne(Tour);
// Delete Tour
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async(req, res, next) => {
    const stats = await Tour.aggregate([{
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                num: { $sum: 1 },
                numRatings: { $sum: 'ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: { avgPrice: 1 },
        },
        // {
        //   $match: { _id: { $ne: 'EASY' } },
        // },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

exports.getMonthlyPlan = catchAsync(async(req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([{
            // Get one document foreach Date selected
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                // Gruping by Month
                _id: { $month: '$startDates' },
                // Count how many tour in a month
                numTourStarts: { $sum: 1 },
                // Get name of the tour for each month
                tours: { $push: '$name' },
            },
        },
        {
            // Add Fields
            $addFields: { month: '$_id' },
        },
        {
            // When we want to not show a field
            $project: {
                _id: 0,
            },
        },
        {
            // Sorting
            $sort: { numTourStarts: -1 },
        },
        {
            $limit: 12,
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan,
        },
    });
});

// router.route/tours-within/:distance/center/:latlng/:unit
// tours-within/233/center/42.626063, 21.137962/unit/mi
exports.getToursWithin = catchAsync(async(req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitutr and longitude in the format lat,lng.',
                400
            )
        );
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ]
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

exports.getDistances = catchAsync(async(req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitutr and longitude in the format lat,lng.',
                400
            )
        );
    }
    const distance = await Tour.aggregate([{
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        // To get only those fields
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            data: distance
        }
    });
})