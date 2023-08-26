/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const dbHelper = require('./helper/dbHelper');
const workoutG = require('./helper/workoutGenerate');
const emailer = require('./helper/emailer');
const skillUtils= require("./helper/skillUtils")
const findMostSimilarUser=require('./helper/similarity.js')
const util=require("./util.js")
const DynamoDBAdapter = require('ask-sdk-dynamodb-persistence-adapter');

var bmi,existingUser;
var userInfo={}

const messages = {
  NOTIFY_MISSING_PERMISSIONS: 'Please enable profile permissions in the Amazon Alexa app and try again',
  ERROR: 'Uh Oh. Looks like something went wrong.'
};
const EMAIL_PERMISSION = "alexa::profile:email:read";


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler for the LaunchRequest
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes()
    const {user,person}=handlerInput.requestEnvelope.context.System
    const userId = user.userId
    const personId=(person)?(person.personId):"null";
    
    existingUser = await dbHelper.getUserFromDynamoDB(userId,personId);

    if(existingUser)
    {
      userInfo={...existingUser}
      const speechText =`<speak>Welcome Back ${existingUser.name}. How can I assist you? </speak>`;
      return handlerInput.responseBuilder
                .speak(speechText)
               .reprompt(speechText)
                .getResponse();
    }
    else
    {
      var speechText = 'Welcome to the Gym Workout Planner. We will start by creating a profile for you. What is your name?';
      userInfo.userId = userId
      userInfo.personId=personId

      if(persistentAttributes.interupptedIntent){
          var forwardTo=persistentAttributes.interupptedIntent
          return handlerInput.responseBuilder
          .speak(`<amazon:emotion name="disappointed" intensity="high">Sorry for the interruption caused, we'll continue from where we left. </amazon:emotion>`)
          .reprompt(`<amazon:emotion name="disappointed" intensity="high">Sorry for the interruption caused, we'll continue from where we left. </amazon:emotion>`)
          .addDelegateDirective(forwardTo)
          .getResponse();    
        }

     return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
    }
  },
};

const callupdateProfileIntentHandler= {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CallUpdateProfileIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var speechText = skillUtils.updateProfPrompt(existingUser);

    sessionAttributes.previouslySaid=speechText;//repeatIntent data
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);//repeatIntent data

    return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(speechText)
    .getResponse(); 
  }
}

const WorkoutDemoIntentHandler= {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WorkoutDemoIntent';
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const { slots } = handlerInput.requestEnvelope.request.intent;
    var nameofworkout= slots.workoutdemo.value

    var workoutnames=await dbHelper.getWorkoutNames()
    nameofworkout=skillUtils.findSimilarString(nameofworkout,workoutnames)
    var workoutData=await dbHelper.getWorkoutDemo(nameofworkout)

    var speechText = `I'll help you with some instructions for ${nameofworkout},`+' '+ workoutData['instructions'];
    sessionAttributes.previouslySaid=speechText;//repeatIntent data
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);//repeatIntent data

    return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(speechText)
    .getResponse(); 
  }
}

const DeleteProfileIntentHandler= {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeleteProfileIntent';
  },
  handle(handlerInput) {
    dbHelper.deleteUser(userInfo.userId,userInfo.personId)
    var speechText = "Your profile has been deleted"
    return handlerInput.responseBuilder
    .speak(speechText)
    .getResponse(); 
  }
}

const GetWorkoutScheduleIntentHandler= {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetWorkoutScheduleIntent';
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let scheduleData= await dbHelper.getWorkoutSchedule(existingUser.userId,existingUser.personId)
    let workoutPlan=scheduleData.workout;
    emailer(1,handlerInput,workoutPlan)
    var speechText = `your personalized workout plan has been mailed to you`;
    sessionAttributes.previouslySaid=speechText;//repeatIntent data
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);//repeatIntent data

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse(); 
  }
}

const GetProgressIntentHandler= {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetProgressIntent';
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const data= await dbHelper.getRecordedWorkouts(userInfo.userId,userInfo.personId)
    if(data.length===0)
      var speechText='You dont have any recorded workouts yet'
    else{
      var speechText="Your Workout Progress Report has been mailed to you"
      emailer(2,handlerInput,data)
      sessionAttributes.optionforEmail=2;
    } 

  return handlerInput.responseBuilder
    .speak(speechText)
    .getResponse(); 
  }
}

const RefreshWorkoutIntentHandler ={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RefreshWorkoutIntent';
  },
  async handle(handlerInput) {
    var workoutsAvailable= await dbHelper.getWorkout()
    WorkoutPlan=workoutG(workoutsAvailable,userInfo.fitnessGoal,userInfo.fitnessLevel)
    dbHelper.regWorkout(userInfo.userId,userInfo.personId, WorkoutPlan)
    await emailer(1,handlerInput,WorkoutPlan);
    var speechText="A new workoutplan has been mailed to you"
  
    return handlerInput.responseBuilder
    .speak(speechText)
    .getResponse();
  }
  
}

///////////////////////////////////------PROFILE UPDATE HANDLER-----------//////////////////////////////////////////////////////////////////////////////////////////////

const updateProfileIntentHandler= {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UpdateProfileIntent';
  },
  async handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    var attribute= slots.attribute.value
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


   attribute=(attribute==='fitness goal' || attribute==='goal')?('fitnessGoal'):attribute
   attribute=(attribute==='fitness level')?('fitnessLevel'):attribute

   var fil= Object.fromEntries(Object.entries(slots).filter(([key, value]) => value.hasOwnProperty('value') && (key!=='attribute')));
   var change= Object.values(fil)[0].value
 
  existingUser[attribute]=change

  if(attribute==="height" || attribute==="weight" ){
    existingUser['bmi']=skillUtils.calculateBMI(existingUser.height,existingUser.weight)

  }
  if(attribute==="fitnessGoal" || attribute==="fitnessLevel"){
    var workoutsAvailable= await dbHelper.getWorkout()
    dbHelper.regUser(existingUser);
    WorkoutPlan=workoutG(workoutsAvailable,existingUser.fitnessGoal,existingUser.fitnessLevel)
    dbHelper.regWorkout(userInfo.userId,userInfo.personId, WorkoutPlan)
    await emailer(1,handlerInput,WorkoutPlan);
    var speechText=`Alright. Your ${attribute} has been updated to ${change}, Since your ${attribute} has changed, new workoutplan has been mailed to you`
  
    return handlerInput.responseBuilder
    .speak(speechText)
    .getResponse();

  }

  dbHelper.regUser(existingUser);//repeatIntent data
  sessionAttributes.previouslySaid=speechText//repeatIntent data

   return handlerInput.responseBuilder
      .speak(`Alright. Your ${attribute} has been updated to ${change} `)
      .reprompt(`Alright. Your ${attribute} has been updated to ${change} `)
      .getResponse();
  }

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////------RECORDS USERS NAME,AGE,GENDER,HEIGHT AND WEIGHT-----------//////////////////////////////////////////////////////////////////////////////////////////////
const UserGeneralInfoIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UserGenInfoIntent';
  },
  async handle(handlerInput) {
    const request=handlerInput.requestEnvelope.request
    const { slots } = request.intent;
    const {requestEnvelope,responseBuilder}=handlerInput
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes()
    var name,age,gender

    const currentIntent = request.intent;
    persistentAttributes.interupptedIntent=currentIntent

    handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
    await handlerInput.attributesManager.savePersistentAttributes();
    
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();

    }
    
    name = Alexa.getSlotValue(requestEnvelope, 'name');
    age=Alexa.getSlotValue(requestEnvelope, 'age')
    gender = Alexa.getSlotValue(requestEnvelope, 'gender');
    const height=Alexa.getSlotValue(requestEnvelope, 'height')
    const weight=Alexa.getSlotValue(requestEnvelope, 'weight')
    
      userInfo.name=name
      userInfo.age=age
      userInfo.gender=gender
      userInfo.height=height
      userInfo.weight=weight
      if(height && weight){
      bmi = skillUtils.calculateBMI(userInfo.height, userInfo.weight);
      userInfo.bmi=bmi}


      let speechText = `Noted! your weight is ${weight} kilograms and your bmi is ${bmi}.`
      sessionAttributes.previouslySaid=speechText

     handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return responseBuilder
            .speak(speechText)
            .addDelegateDirective(
              {
                name: 'GoalIntent',
                confirmationStatus: 'NONE',
                slots: {}
             })
            .getResponse();
    
}
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////------RECORDS STRENGTH WORKOUT-----------//////////////////////////////////////////////////////////////////////////////////////////////
var recordedWorkouts=[]
const StrengthWorkoutIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StrengthWorkoutIntent'

  },
  async handle(handlerInput) {
    var workoutname
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.previousIntent=Alexa.getIntentName(handlerInput.requestEnvelope)
    const request=handlerInput.requestEnvelope.request

    var type= request.intent.slots.type.value
    if(request.intent.slots.workoutname.resolutions)
        workoutname=request.intent.slots.workoutname.resolutions.resolutionsPerAuthority[0].values[0].value.name
    else
        workoutname=request.intent.slots.workoutname.value

    if(workoutname)
    {
      var workoutnames=await dbHelper.getWorkoutNames()
      workoutname=skillUtils.findSimilarString(workoutname,workoutnames)
      request.intent.slots.workoutname.value=workoutname
    }
    

    var sets=request.intent.slots.sets.value
    var reps=request.intent.slots.reps.value
    var time=request.intent.slots.time.value
    var timeunit=request.intent.slots.timeunit.value

    const currentIntent = handlerInput.requestEnvelope.request.intent;


    if(type==='cardio' && (!workoutname || !time)){
      request.intent.slots.sets.value=1000
     request.intent.slots.reps.value=1000
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    }

    if(type==='strength' && (!workoutname || !sets || !reps)){
      request.intent.slots.time.value=1000
      return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
    }

    var i=sessionAttributes.currentWorkout
    var workoutdict={'workoutname':workoutname}


    if(type==='strength'){
      workoutdict['sets']=sets
      workoutdict['reps']=reps
      workoutdict['type']=type
    sessionAttributes.currentWorkout=sessionAttributes.currentWorkout+1
    let speechText = "Noted! if you wanna record one more workout, try saying 'record next workout' or 'stop' to finish recording ";
    sessionAttributes.previouslySaid=speechText
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    recordedWorkouts.push(workoutdict)

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();

    }
    if(type==='cardio')
    {
      workoutdict['time']=time+' '+timeunit
      workoutdict['type']=type
      sessionAttributes.currentWorkout=sessionAttributes.currentWorkout+1
      let speechText = "Noted! if you wanna record one more workout, try saying 'record next workout' or 'stop' to finish recording ";
      sessionAttributes.previouslySaid=speechText
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
      recordedWorkouts.push(workoutdict)

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
      
      if(request.dialogState && request.dialogState!=='COMPLETED'){
      return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
      }
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////------GETS FITNESS GOAL------------/////////////////////////////////////////////////////////////////////////////
const GoalIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GoalIntent';
  },
  async handle(handlerInput) {
    var fitnessGoalSlot = handlerInput.requestEnvelope.request.intent.slots.goal.value;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes()


    userInfo.fitnessGoal=fitnessGoalSlot;

    persistentAttributes.interupptedIntent=handlerInput.requestEnvelope.request.intent
    handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
    await handlerInput.attributesManager.savePersistentAttributes();

    const speechText = `Cool! How would you rate your current fitness level as, Beginner or Intermediate or Expert?`;
    sessionAttributes.previouslySaid=speechText
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
   
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse(); 
 
  },
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////------GETS FITNESS LEVEL AND SENDS EMAIL------------//////////////////////////////////////////
const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const d = new Date();
let day = weekday[d.getDay()];
var WorkoutPlan

const FitnessLevelIntent ={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FitnessLevelIntent';
  },
  async handle(handlerInput) {
    var fitnessLevel = handlerInput.requestEnvelope.request.intent.slots.fitnessLevel.value;
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes()
    

    userInfo.fitnessLevel=fitnessLevel

    persistentAttributes.interupptedIntent=handlerInput.requestEnvelope.request.intent
    handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
    await handlerInput.attributesManager.savePersistentAttributes();

    const mostSimilarUser = await findMostSimilarUser(userInfo);//Cosine Similarity finder for similar user

    if(mostSimilarUser)
    {
    console.log("Most similar user:", mostSimilarUser);
    let scheduleData= await dbHelper.getWorkoutSchedule(mostSimilarUser['userId'],mostSimilarUser['personId'])
    let workoutPlan=scheduleData.workout;
  
    dbHelper.regWorkout(userInfo.userId,userInfo.personId, workoutPlan)
     emailer(1,handlerInput,workoutPlan).then(()=>
   {
      dbHelper.regUser(userInfo);
      handlerInput.attributesManager.deletePersistentAttributes(persistentAttributes)
   });

    return handlerInput.responseBuilder
        .speak(`Based on your Fitness level and Fitness Goal, a personalized workout plan has been mailed to you. `)
        .reprompt(`Based on your Fitness level and Fitness Goal, a personalized workout plan has been mailed to you. `)
        .getResponse(); 
    }
    else{
    return dbHelper.getWorkout()
    .then(async (data)=>{
       
        WorkoutPlan=workoutG(data,userInfo.fitnessGoal,userInfo.fitnessLevel)
        dbHelper.regWorkout(userInfo.userId,userInfo.personId, WorkoutPlan)
        emailer(1,handlerInput,WorkoutPlan).then(()=>{
          dbHelper.regUser(userInfo);
          handlerInput.attributesManager.deletePersistentAttributes( persistentAttributes)
        })

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.optionforEmail=1
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes)
       

        var speechText = `Based on your Fitness level and Fitness Goal, a personalized workout plan has been mailed to you. `;
        if(day!=="Sunday" && day !=="Saturday"){
          speechText+=` Today's ${day}, if you wanna start today's workout now, try saying "start the workout"`
        }
        sessionAttributes.previouslySaid=speechText
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse(); })
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const SendEmailIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendEmailIntent';
},
async handle(handlerInput) {
  if(sessionAttributes.optionforEmail==1){
    let scheduleData= await dbHelper.getWorkoutSchedule(existingUser.userId,existingUser.personId)
    let workoutPlan=scheduleData.workout;
  emailer(1,handlerInput,workoutPlan);
    var speechText = `Your personalized workout plan has been mailed to you. </speak>`;
    if(day!=='Sunday' && day !=='Saturday'){
      speechText+=` Today's ${day}, if you wanna start today's workout now, try saying "start the workout"`
    }
  }
  else{
    const data= await dbHelper.getRecordedWorkouts(userInfo.userId,userInfo.personId)
    if(!data)
    speechText='You dont have any recorded workouts yet'
  else
    {
      emailer(2,handlerInput,data);
      var speechText ="Your Workout Progress Report has been mailed to you"
    } 


  }
  return handlerInput.responseBuilder
  .speak(speechText)
  .reprompt(speechText)
  .getResponse();
  }

}

///////////////////////////////////------Start/continue workout Handler------------////////////////////////////////////////////////////////////////////////////////////

const WorkoutIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WorkoutIntent';
  },
  async handle(handlerInput) {
    const weekday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const d = new Date();
    let day = weekday[d.getDay()];

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes()
    var control = handlerInput.requestEnvelope.request.intent.slots.control.value;
    
    let workoutPlan=''
    let scheduleData= await dbHelper.getWorkoutSchedule(userInfo.userId,userInfo.personId)
    workoutPlan=scheduleData.workout;

    var workout=workoutPlan[day]
    var workoutCount= workout.length

    if(workoutCount===0){
      return handlerInput.responseBuilder
      .speak("Hmm! According to your workout schedule, today's rest day")
      .reprompt("Hmm! According to your workout schedule, today's rest day")
      .getResponse(); 

    }

    if(control==="start"){
      if(workout[0]['muscle']==="cardio"){
         var speechText=`start the workout with ${workout[0]['workout']} for ${workout[0]['time']} mins, `
         speechText+=` say "next workout" after you complete this workout. if you want to know instructions for this workout, try saying "instruct me" `
      }
      else{
        var speechText=`start the workout with ${workout[0]['workout']} doing ${workout[0]['sets']} sets of ${workout[0]['reps']} reps, `
        speechText+=` say "next workout" after you complete this workout. if you want to know instructions for this workout, try saying "instruct me"` }
        persistentAttributes.workoutno=1
        handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
        await handlerInput.attributesManager.savePersistentAttributes();
    }
    else if((control==="next" || control==="continue") ){
      if(persistentAttributes.workoutno){
          var i= persistentAttributes.workoutno;
          if(workout[i]['muscle']==="cardio")
          {
            var speechText=`next workout is ${workout[i]['workout']} for ${workout[i]['time']} mins, `
            persistentAttributes.workoutno=i+1
          }
          else
          {
            var speechText=`next workout is ${workout[i]['workout']} doing ${workout[i]['sets']} sets of ${workout[i]['reps']} reps, `
            persistentAttributes.workoutno=i+1
          }
          if(persistentAttributes.workoutno<workoutCount){
            speechText+=` say "next workout" after you complete this workout. if you want to know instructions for this workout, try saying "instruct me"`     
            handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
            await handlerInput.attributesManager.savePersistentAttributes();
          }
          else{
            var speechText="End of today's workout session"
            await handlerInput.attributesManager.deletePersistentAttributes( persistentAttributes);
          }

        }
        else if(!persistentAttributes.workoutno){
          var speechText="You don't have a workout session in progress, try saying 'start the workout'"
        }
    }

    else if(control==="instruct"){
      if(persistentAttributes.workoutno){
        var i= persistentAttributes.workoutno;
        var speechText =`<speak> ${workout[i]['instructions']}`
        speechText+=` say 'next workout' after you complete this workout</speak>`
      }
      else{
        var speechText =`You don't have any workout session currently in progress, say 'start the workout' to start a new workout session`
      }

    }
   sessionAttributes.previouslySaid=speechText
   handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(speechText)
    .getResponse(); 

  
}

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        if(sessionAttributes.previousIntent==='StrengthWorkoutIntent' && recordedWorkouts.length>0){
          dbHelper.storeWorkoutinDB(userInfo.userId,userInfo.personId, recordedWorkouts)
          recordedWorkouts=[]
          var speakOutput='workouts has been recorded'
        }
       else
       var speakOutput = 'Goodbye!';

       return handlerInput.responseBuilder
          .speak(speakOutput)
           .getResponse();
   }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const RepeatIntentHandler = {
  canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
          && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


      var speakOutput = 'I dont have anything in memory';

      if(sessionAttributes.previouslySaid){
        speakOutput=sessionAttributes.previouslySaid
      }

      return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(speakOutput)
          .getResponse();
  }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(new DynamoDBAdapter.DynamoDbPersistenceAdapter({
      tableName: 'InProgress',
      createTable: true,
    }))
    .addRequestHandlers(
        LaunchRequestHandler,
        callupdateProfileIntentHandler,
        GetWorkoutScheduleIntentHandler,
        GetProgressIntentHandler,
        WorkoutDemoIntentHandler,
        RefreshWorkoutIntentHandler,
        updateProfileIntentHandler,
        DeleteProfileIntentHandler,
        UserGeneralInfoIntentHandler,
        StrengthWorkoutIntentHandler,
        WorkoutIntentHandler,
        GoalIntentHandler,
        FitnessLevelIntent,
        SendEmailIntentHandler,

        HelpIntentHandler,
        CancelAndStopIntentHandler,
        RepeatIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();