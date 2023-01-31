const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Uncaught exception
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! Shuting down...');
    console.log(err.name, err.message);
    // After we detect the error, close the server and exit aplication
    process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

// AWS Database
// const DB = process.env.DATABASE.replace(
//   'PASSWORD',
//   process.env.DATABASE_PASSWORD
// );

// Localhost DB
const DB = process.env.DATABASE_LOCAL;

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then((con) => {
        // console.log(con.connections);
        console.log('DB connection successful');
    });

// Start the SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

// When we have problem with our DB connection or error like this with DB
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! Shuting down...');
    console.log(err.name, err.message);
    // After we detect the error, close the server and exit aplication
    server.close(() => {
        process.exit(1);
    });
});