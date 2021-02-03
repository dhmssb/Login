require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const passport = require("passport")
const path = require("path")

// setting koneksi
const connUri = process.env.MONGO_LOCAL_CONN_URL
let PORT = process.env.PORT || 3000


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

mongoose.promise = global.Promise;
mongoose.connect(connUri, { 
    useNewUrlParser: true, 
    useCreateIndex: true,
    useUnifiedTopology: true
})

const connection = mongoose.connection;
connection.once('open', () => console.log('database connection success!'));
connection.on('error', (err) => {
    console.log(`connection error ${err}`);
    process.exit();
});

app.use(passport.initialize());
require("./middlewares/jwt")(passport);

require('./routes/index')(app);


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
