var aws = require('aws-sdk');
var nodemailer = require('nodemailer');
var smtpTransport = require("nodemailer-smtp-transport");

var ses = new aws.SES({ region: 'us-west-2' });
var s3 = new aws.S3();


function getS3File(bucket, key) {
    return new Promise(function (resolve, reject) {
        s3.getObject(
            {
                Bucket: bucket,
                Key: key
            },
            function (err, data) {
                if (err) return reject(err);
                else return resolve(data);
            }
        );
    })
}

exports.handler = function (event, context, callback) {

    console.log("Incoming: ", event);
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };

    s3.getObject({
        Bucket: bucket,
        Key: key
    }, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(err);
        } else {
            var htmldata = data.Body.toString('ascii');
            console.log("Raw text:\n" + data.Body.toString('ascii'));
            var get_status_from_html = htmldata.substring(3300,3480);
            console.log("Status:\n" +   get_status_from_html);
            if (get_status_from_html.indexOf("Failed") >=0 ) {
               console.log("contains failure scenario");
               var result = "Failure";
               getS3File(bucket, key).then(function (fileData) {
                   var subject_value = 'UI Automation Health Check - ' + result;
                   console.log(subject_value);
                   var mailOptions = {
                       from: 'donotreply@test.com',
                       subject: subject_value,
                       html: '<p>Dear Team,</p><p>Please find the attached email for the automation result. For best view please download and view the html file.</p><p>Below link contains complete list of html reports upto date</p><p>Regards,</p><p>Sravan</p>',
                       to: ['sravankumarreddy.bade@gmail.com'],
                       // bcc: Any BCC address you want here in an array,
                       attachments: [
                           {
                               filename: "UI-Automation-Report.html",
                               content: fileData.Body
                           }
                       ]
                   };
                   console.log('Creating SES transporter');
                   // create Nodemailer SES transporter
                //    var transporter = nodemailer.createTransport({
                //        SES: ses
                //    });
                   
                var transporter = nodemailer.createTransport(smtpTransport({
                    host: "mail-sysrelay.test.net",
                    port: 25,
                    secure: false
                }));
                   // send email
                   transporter.sendMail(mailOptions, function (err, info) {
                       if (err) {
                           console.log(err);
                           console.log('Error sending email');
                           callback(err);
                       } else {
                           console.log('Email sent successfully');
                           callback();
                       }
                   });
               })
               .catch(function (error) {
                   console.log(error);
                   console.log('Error getting attachment from S3');
                   callback(error);
               });
            }
            else{
                var result = "Successful";
                getS3File(bucket, key).then(function (fileData) {
                   var subject_value = 'UI Automation Health Check - ' + result;
                   console.log(subject_value);
                   var mailOptions = {
                       from: 'donotreply@test.com',
                       subject: subject_value,
                       html: '<p>Dear Team,</p><p>Please find the attached email for the UI automation result. For best view please download and view the html file.</p><p>Below link contains complete list of html reports upto date</p><p>Regards,</p><p>Sravan</p>',
                       to: ['sravankumarreddy.bade@gmail.com'],
                       // bcc: Any BCC address you want here in an array,
                       attachments: [
                           {
                               filename: "UI-Automation-Report.html",
                               content: fileData.Body
                           }
                       ]
                   };
                   console.log('Creating SES transporter');
                    // create Nodemailer SES transporter
                    var transporter = nodemailer.createTransport({
                        SES: ses
                    });
        
                    // send email
                    transporter.sendMail(mailOptions, function (err, info) {
                        if (err) {
                            console.log(err);
                            console.log('Error sending email');
                            callback(err);
                        } else {
                            console.log('Email sent successfully');
                            callback();
                        }
                    });
                })
                .catch(function (error) {
                    console.log(error);
                    console.log('Error getting attachment from S3');
                    callback(error);
                });
            }
        }
    });
    
};
