const express = require('express')
const {check} = require('express-validator')

const Auth = require('../controllers/auth')
const validate = require('../middlewares/validate')

const router = express.Router()

router.get('/', (req, res) => {
    res.status(200).json({
        message: 'You are in the Auth Endpoint. Register or Login to test Authentication.'})
})

router.post('/register', [
    check('email').isEmail().withMessage('Enter a valid email address'),
    check('username').not().isEmpty().withMessage('username is required'),
    check('password').not().isEmpty().isLength({min: 6}).withMessage('Must be at least 6 chars long'),
    check('name').not().isEmpty().withMessage('name is required')
], validate, Auth.register)

router.post("/login", [
    check('email').isEmail().withMessage('Enter a valid email address'),
    check('password').not().isEmpty(),
], validate, Auth.login)

router.post('/recover', [
    check('email').isEmail().withMessage('Enter a valid email address'),
], validate, Auth.recover)

router.get('/reset/:token', Auth.reset)

router.post('/reset/:token', [
    check('password').not().isEmpty().isLength({min: 6}).withMessage('Must be at least 6 chars long'),
    check('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.password)),
], validate, Auth.resetPassword)


module.exports = router

