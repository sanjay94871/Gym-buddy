const fs = require('fs');
var AWS = require("aws-sdk");
const nodemailer = require("nodemailer");
const aws = require("@aws-sdk/client-ses");
let { defaultProvider } = require("@aws-sdk/credential-provider-node");
var profileEmail=''

const messages = {
  NOTIFY_MISSING_PERMISSIONS: 'Please enable profile permissions in the Amazon Alexa app.',
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
    console.log(profileEmail)
  } catch (error) {
    console.log("error da"+profileEmail);
    if (error.statusCode == 403) {
      return responseBuilder
      .speak(messages.NOTIFY_MISSING_PERMISSIONS)
      .withAskForPermissionsConsentCard([EMAIL_PERMISSION])
      .getResponse();
    }
    console.log("error da");
    const response = responseBuilder.speak(messages.ERROR).getResponse();
    return response;
  }
}
  
var emailer= async function (handlerInput,workoutData){
// Function to convert workout data into an HTML table
await getEmail(handlerInput);
function convertScheduleToHTML(workoutData) {
  let htmlTable = '<table border="1">';
  htmlTable += '<tr><th>Day</th><th>Workout</th><th>Muscle</th><th>Sets</th><th>Reps</th></tr>';

  for (const day in workoutData) {
    
    const workouts = workoutData[day];
    if(workouts.length==0){
      htmlTable+=`<tr ><td>${day}</td><td colspan='4'>Rest Day</td></tr>`
    }
    else{
    htmlTable+=`<tr ><td rowspan='5'>${day}</td>`
    workouts.forEach((workout) => {
      htmlTable += `<td>${workout.workout}</td><td>${workout.muscle}</td><td>${workout.sets}</td><td>${workout.reps}</td></tr><tr>`;
    });
  }
  }

  htmlTable += '</table>';
  return htmlTable;
}

// Generate the HTML content with the workout table
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Workout Schedule</title>
</head>
<body>
  <h1>Workout Schedule</h1>
  ${convertScheduleToHTML(workoutData)}
</body>
</html>
`;


// Write the HTML content to a file named "workout_schedule.html"
fs.writeFile('/tmp/workout_schedule.html', htmlContent, (err) => {
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
      subject: "Workout plan",
      text: "Here's your personalised workout plan",
      attachments: [
        {
          filename: 'workout_schedule.html', 
          path: '/tmp/workout_schedule.html' 
        }
      ],
    },
    (err, info) => {
      if(err){
      return handlerInput.responseBuilder
      .speak(messages.NOTIFY_MISSING_PERMISSIONS)
      .withAskForPermissionsConsentCard([EMAIL_PERMISSION])
      .getResponse();
    }
    else{
      console.log(info.envelope)
    }
  }
  );
}

module.exports= emailer;
