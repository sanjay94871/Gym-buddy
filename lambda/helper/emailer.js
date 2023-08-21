const fs = require('fs');
var AWS = require("aws-sdk");
const nodemailer = require("nodemailer");
const aws = require("@aws-sdk/client-ses");
let { defaultProvider } = require("@aws-sdk/credential-provider-node");

const {scheduleTable, recordTable}=require("./workoutSchedule");

var profileEmail=''

const messages = {
  NOTIFY_MISSING_PERMISSIONS: 'Please enable profile permissions in the Amazon Alexa app and try again',
  ERROR: 'Uh Oh. Looks like something went wrong.'
};
const EMAIL_PERMISSION = "alexa::profile:email:read";

AWS.config.update({
    accessKeyId: 'AKIARAADIWA2PQ6VRWM3',
    secretAccessKey: 'QOL2WHa6cX4uj3pYf5khb8QW4UtG7aNJsRHfzuC7',
    region: 'us-east-1', // e.g., 'us-east-1'
  });
  

var getEmail= async function (handlerInput){
  const { serviceClientFactory, responseBuilder } = handlerInput;
  try {
    
    const upsServiceClient = serviceClientFactory.getUpsServiceClient();
    profileEmail = await upsServiceClient.getProfileEmail();
    
  } catch (error) {
    if (error.statusCode == 403) {
      return responseBuilder
      .speak(messages.NOTIFY_MISSING_PERMISSIONS)
      .withAskForPermissionsConsentCard([EMAIL_PERMISSION])
      .getResponse();
    }
    console.log("error at getting email address"+error);
    const response = responseBuilder.speak(messages.ERROR).getResponse();
    return response;
  }
}
  
var emailer= async function (optionforEmail,handlerInput,workoutData){
// Function to convert workout data into an HTML table
await getEmail(handlerInput);
var emailText='',filename='',subject='',speechText=''

if(optionforEmail===1){
  var htmlContent=scheduleTable(workoutData)
  speechText='Your personalized workout plan has been mailed to you'
  emailText="Here's your personalised workout plan"
  filename="workout_schedule.html"
  subject="Workout Plan"
}
else
{
  var htmlContent=recordTable(workoutData)
  speechText='Your workout progress report has been mailed to you'
  emailText="Here's your progress report"
  filename="progress_report.html"
  subject="Workout Progress Report"
}


// Write the HTML content to a file named "workout_schedule.html"
fs.writeFile(`/tmp/${filename}`, htmlContent, (err) => {
  if (err) {
    console.error('Error writing the file:', err);
  } else {
    console.log('HTML file generated successfully!');
  }
});


const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: "us-east-1",
    defaultProvider,
  });

  
  // create Nodemailer SES transporter
  let transporter = nodemailer.createTransport({
    SES: { ses, aws },
  });


  // send some mail
 transporter.sendMail(
    {
      from: profileEmail,
      to: profileEmail,
      subject: subject,
      text: emailText,
      attachments: [
        {
          filename: `${filename}`, 
          path: `/tmp/${filename}` 
        }
      ],
    },
    (err, info) => {
      if(err){
      console.log(err)
      return handlerInput.responseBuilder
      .speak(messages.NOTIFY_MISSING_PERMISSIONS)
      .withAskForPermissionsConsentCard([EMAIL_PERMISSION])
      .getResponse();
    }
    else{
      console.log("mail sent")
      // return handlerInput.responseBuilder
      // .speak(speechText)
      // .getResponse()
    }
  }
  );

}

module.exports= emailer;
