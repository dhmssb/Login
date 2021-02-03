const User = require('../models/user');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//POST api/auth/register
//================Register==============
exports.register = (req, res) => {

    User.findOne({email: req.body.email})
        .then(user => {

            if (user) return res.status(401).json({
                message: 'email address is already registered'})

            const newUser = new User(req.body)
            newUser.save()
                .then(user => res.status(200).json({token: user.generateJWT(), user: user}))
                .catch(err => {
                    let message = err.message
                    if (err.code === 11000) message = 'email address is linked to another account'

                    res.status(500).json({message})
                })
        })
        .catch(err => res.status(500).json({
            success: false, 
            message: err.message
        }))
}

//POST api/auth/login
//=================LOGIN USER====================
exports.login = (req, res) => {
    User.findOne({email: req.body.email})
        .then(user => {
            if (!user) return res.status(401).json({
                message: `we cant find email with ${req.body.email}`
            })

            //validate pass
            if (!user.comparePassword(req.body.password)) return res.status(401).json({
                message: 'Invalid email or password'
            })

            // sukses
            res.status(200).json({token: user.generateJWT(), user: user})
        })
        .catch(err => res.status(500).json({message: err.message}))
}


// ===========PASSWORD RECOVER AND RESET===================

//POST api/auth/recover
// ==========================Generates token,reset password==============================
exports.recover = (req, res) => {
    User.findOne({email: req.body.email})
        .then(user => {
            if (!user) return res.status(401).json({
                message: `we cant find email with ${req.body.email}`});

            
            user.generatePasswordReset();

            // Save the updated user object
            user.save()
                .then(user => {
                    // send email
                    let link = `http://${req.headers.host}/api/auth/reset/${user.resetPasswordToken}`
                    console.log(link)
                    const mailOptions = {
                        to: user.email,
                        from: process.env.FROM_EMAIL,
                        subject: 'Password change request',
                        text: `Hi ${user.username} \n 
                    Please click on the following link ${link} to reset your password. \n\n 
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`,
                    }

                    sgMail.send(mailOptions, (error, result) => {
                        if (error) return res.status(500).json({message: error.message})

                        res.status(200).json({
                            message: `A reset email has been sent to ${user.email}`})
                    });
                })
                .catch(err => res.status(500).json({message: err.message}))
        })
        .catch(err => res.status(500).json({message: err.message}))
};

//POST api/auth/reset
//=======Validasi password reset token, tampil reset view==========
exports.reset = (req, res) => {
    User.findOne({
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: {$gt: Date.now()}
    })
        .then((user) => {
            if (!user) return res.status(401).json({
                message: 'Password reset token invalid or expired'
            })

            //Redirect user to form with the email address
            res.render('reset', {user})
        })
        .catch(err => res.status(500).json({message: err.message}))
};


//POST api/auth/reset
//=======================Reset Password====================
exports.resetPassword = (req, res) => {
    User.findOne({
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: {$gt: Date.now()}})
        
        .then((user) => {
            if (!user) return res.status(401).json({
                message: 'Password reset token is invalid or has expired.'
            })

            //Set pass baru
            user.password = req.body.password
            user.resetPasswordToken = undefined
            user.resetPasswordExpires = undefined

            // Save
            user.save((err) => {
                if (err) return res.status(500).json({message: err.message})

                // send email
                const mailOptions = {
                    to: user.email,
                    from: process.env.FROM_EMAIL,
                    subject: "Your password has been changed",
                    text: `Hi ${user.username} \n 
                    This is a confirmation that the password for your account ${user.email} has just been changed.\n`
                }

                sgMail.send(mailOptions, (error, result) => {
                    if (error) return res.status(500).json({
                        message: error.message
                    })

                    res.status(200).json({message: 'Your password has been updated.'});
                })
            })
        })
}