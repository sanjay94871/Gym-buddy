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
const util=require("./util.js")
const DynamoDBAdapter = require('ask-sdk-dynamodb-persistence-adapter');

var bmi,existingUser;
var userInfo ={
  userId:'',
  personId:'',
  name:'',
  age:'',
  gender:'',
  height:'',
  weight:'',
  fitnessGoal:'',
  bmi:'',
  fitnessLevel:''
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler for the LaunchRequest
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const {user,person}=handlerInput.requestEnvelope.context.System
    const userId = user.userId
    const personId=(person)?(person.personId):"null";
    console.log(personId)
    
    existingUser = await dbHelper.getUserFromDynamoDB(userId,personId);

    if(existingUser){
      userInfo={...existingUser}
      const speechText =`<speak>Welcome Back ${existingUser.name}. How can I assist you. </speak>`;
      return handlerInput.responseBuilder
                .speak(speechText)
                .addDelegateDirective({
                  name: 'LaunchOptionIntent',
                  confirmationStatus: 'NONE',
                  slots: {}
               })
               .reprompt(speechText)
                .getResponse();
    }
    else{
    const speechText = 'Welcome to the Gym Workout Planner. We will start by creating a profile for you. What is your name?';
    userInfo.userId = userId
    userInfo.personId=personId
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt("Welcome to the Gym Workout Planner. We will start by creating a profile for you.")
      .getResponse();
    }
  },
};



const LaunchOptionIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LaunchOptionIntent' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.SelectIntent';
  },
  async handle(handlerInput) {
    try{
    const request=handlerInput.requestEnvelope.request
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    var speechText

    if(Alexa.getIntentName(handlerInput.requestEnvelope) === 'LaunchOptionIntent')
       var option = handlerInput.requestEnvelope.request.intent.slots.option.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    else
      var option = handlerInput.requestEnvelope.request.intent.slots.ListPosition.value  
   
    switch(option){
      case '1':speechText = skillUtils.updateProfPrompt(existingUser);
                break;
      case '2':speechText = `Great! What type of workout was it, Strength or Cardio?`;
              sessionAttributes.currentWorkout=0;
              break;
                  
      case '3':speechText = 'Do you want to start a workout or continue previous workout?';
              break;
                
      case '4': let workoutPlan='';
              return dbHelper.getWorkout()
              .then((data)=>{
                  workoutPlan=workoutG(data,existingUser.fitnessGoal,existingUser.fitnessLevel)
                  emailer(1,handlerInput,workoutPlan);
                  sessionAttributes.optionforEmail=1;
                  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                  speechText = `your personalized workout plan has been mailed to you`;
                  sessionAttributes.previouslySaid=speechText

                  return handlerInput.responseBuilder
                    .speak(speechText)
                    .reprompt(speechText)
                    .getResponse();})

      case '5' :try{
                const data= await dbHelper.getRecordedWorkouts(userInfo.userId,userInfo.personId)
                console.log(data)
                  if(!data)
                    speechText='You dont have any recorded workouts yet'
                  else
                    {
                      speechText="Your Workout Progress Report has been mailed to you"
                      emailer(2,handlerInput,data)
                      sessionAttributes.optionforEmail=2;
                    } 
                  } 
                catch(err){
                  console.log(err)
                }
                break;          
      case '6':speechText=`<speak>Choose an option from 1-6. 1. Update my profile, 2. Record a workout, 3. start or continue workout,  4. Get workout schedule, 5. Send Progress Report, if you want to repeat the options, say 'repeat'</speak>`;
                sessionAttributes.previouslySaid=speechText
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                return handlerInput.responseBuilder
                .addDelegateDirective(
                {
                  name: 'AMAZON.RepeatIntent',
                  confirmationStatus: 'NONE',
                  slots: {}
               })
                  .getResponse();
     
    }
    sessionAttributes.previouslySaid=speechText
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse(); 
  }
  catch(err){
    console.log(err)
  }
}
}

///////////////////////////////////------PROFILE UPDATE HANDLER-----------//////////////////////////////////////////////////////////////////////////////////////////////

const updateProfileIntentHandler= {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UpdateProfileIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    var attribute= slots.attribute.value
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


   attribute=(attribute==='fitness goal')?('fitnessGoal'):attribute
   attribute=(attribute==='fitness level')?('fitnessLevel'):attribute

   var fil= Object.fromEntries(Object.entries(slots).filter(([key, value]) => value.hasOwnProperty('value') && (key!=='attribute')));
   var change= Object.values(fil)[0].value
 
  existingUser[attribute]=change

  if(attribute==="height" || attribute==="weight"){
    existingUser['bmi']=skillUtils.calculateBMI(existingUser.height,existingUser.weight)
  }

  dbHelper.regUser(existingUser);
  sessionAttributes.previouslySaid=speechText

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
  handle(handlerInput) {
    const request=handlerInput.requestEnvelope.request
    const {requestEnvelope,responseBuilder}=handlerInput
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var name,age,gender

    const currentIntent = request.intent;
    if (request.dialogState && request.dialogState !== 'COMPLETED') {
      console.log("something")
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
      bmi = skillUtils.calculateBMI(userInfo.height, userInfo.weight);
      userInfo.bmi=bmi


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


///////////////////////////////////------GETS STRENGTH OR CARDIO TYPE AND PASS ON-----------///////////////////////////////////////////////////////////
const StrengthOrCardioIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StrengthOrCardioIntent';
  },
  handle(handlerInput) {
    const type=  handlerInput.requestEnvelope.request.intent.slots.type.value;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    console.log(type)
    if(type==='strength'){
      console.log(type)
      return handlerInput.responseBuilder
        .addDelegateDirective(
          {
            name: 'StrengthWorkoutIntent',
            confirmationStatus: 'NONE',
            slots: {}
         })
         .getResponse()
    }
    else if(type==='cardio'){
      console.log(type)
      return handlerInput.responseBuilder
        .addDelegateDirective(
          {
            name: 'CardioWorkoutIntent',
            confirmationStatus: 'NONE',
            slots: {}
         })
         .getResponse()
    }
    else{
      return handlerInput.responseBuilder
      .speak("currently not supported")
      .reprompt("currently not supported")
    }
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////------RECORDS STRENGTH WORKOUT-----------//////////////////////////////////////////////////////////////////////////////////////////////
var recordedWorkouts={}
const StrengthWorkoutIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StrengthWorkoutIntent'

  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.previousIntent=Alexa.getIntentName(handlerInput.requestEnvelope)
    const request=handlerInput.requestEnvelope.request

    var type= request.intent.slots.type.value
    var workoutname=request.intent.slots.workoutname.value
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
    recordedWorkouts[i]={}
    recordedWorkouts[i]['workoutname']=workoutname


    if(type==='strength'){
      recordedWorkouts[i]['sets']=sets
      recordedWorkouts[i]['reps']=reps
      recordedWorkouts[i]['type']=type
    sessionAttributes.currentWorkout=sessionAttributes.currentWorkout+1
    let speechText = "Noted! if you wanna record one more workout, try saying 'record next workout' or 'stop' to finish recording ";
    sessionAttributes.previouslySaid=speechText
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();

    }
    if(type==='cardio')
    {
      recordedWorkouts[i]['time']=time+' '+timeunit
      recordedWorkouts[i]['type']=type
      sessionAttributes.currentWorkout=sessionAttributes.currentWorkout+1
      let speechText = "Noted! if you wanna record one more workout, try saying 'record next workout' or 'stop' to finish recording ";
      sessionAttributes.previouslySaid=speechText
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      return handlerInput.responseBuilder
        .speak(speechText)
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
  
   
   
    userInfo.fitnessGoal=fitnessGoalSlot;
    const speechText = `Cool! How would rate your current fitness level as, Beginner or Intermediate or Expert?`;
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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    userInfo.fitnessLevel=fitnessLevel
    dbHelper.regUser(userInfo);

    return dbHelper.getWorkout()
    .then((data)=>{
        
        WorkoutPlan=workoutG(data,userInfo.fitnessGoal,userInfo.fitnessLevel)
        console.log(WorkoutPlan);
        dbHelper.regWorkout(userInfo.userId,userInfo.personId, WorkoutPlan)
        emailer(1,handlerInput,WorkoutPlan);
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.optionforEmail=1
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes)
       

        var speechText = `Based on your Fitness level and Fitness Goal, a personalized workout plan has been mailed to you. `;
        if(day!=='Sunday' || day !=='Saturday'){
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const SendEmailIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendEmailIntent';
},
async handle(handlerInput) {
  if(sessionAttributes.optionforEmail==1){
  emailer(1,handlerInput,WorkoutPlan);
    var speechText = `<speak>Based on your Fitness level and Fitness Goal, a personalized workout plan has been mailed to you. </speak>`;
    if(day!=='Sunday' || day !=='Saturday'){
      speechText+=` Today's ${day}, if you wanna start today's workout now, try saying "start the workout"`
    }
  }
  else{
    emailer(2,handlerInput,WorkoutPlan);
    var speechText ="Your Workout Progress Report has been mailed to you"

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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    try{
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes()
    var control = handlerInput.requestEnvelope.request.intent.slots.control.value;
    let workoutPlan=''

    await dbHelper.getWorkoutSchedule(userInfo.userId, userInfo.personId).then((data)=>workoutPlan=data.workout)

    var workout=workoutPlan[day]
    var workoutCount= workout.length

   
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
    else if((control==="next" || control==="continue") && persistentAttributes.workoutno<workoutCount){
      var i= persistentAttributes.workoutno;
      if(workout[i]['muscle']==="cardio")
      {
        var speechText=`next workout is ${workout[i]['workout']} for ${workout[i]['time']} mins, `
        speechText+=` say "next workout" after you complete this workout. if you want to know instructions for this workout, try saying "instruct me"`
      }
      else
      {
        var speechText=`next workout is ${workout[i]['workout']} doing ${workout[i]['sets']} sets of ${workout[i]['reps']} reps, `
        speechText+=` say "next workout" after you complete this workout. if you want to know instructions for this workout, try saying "instruct me"`   
      }
      persistentAttributes.workoutno=i+1
      handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
      await handlerInput.attributesManager.savePersistentAttributes();
    }
    else if(control==="instruct"){
      var i= persistentAttributes.workoutno;
      var speechText =`<speak> ${workout[i]['instructions']}</speak>`
      speechText+=` say "next workout" after you complete this workout`

    }
    else{
      var speechText="End of today's workout session"
      handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
      await handlerInput.attributesManager.savePersistentAttributes();
   }

   sessionAttributes.previouslySaid=speechText
   handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(speechText)
    .getResponse(); 

  }
  catch(err){
    console.log(err)
  }
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

        if(sessionAttributes.previousIntent==='StrengthWorkoutIntent'){
          dbHelper.storeWorkoutinDB(userInfo.userId,userInfo.personId, recordedWorkouts)
          var speakOutput='workouts has been recorded'
        }
       else
       var speakOutput = 'Goodbye!';

       return handlerInput.responseBuilder
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
      tableName: 'InProgressWorkout',
      createTable: true,
    }))
    .addRequestHandlers(
        LaunchRequestHandler,
        LaunchOptionIntentHandler,
        updateProfileIntentHandler,
        UserGeneralInfoIntentHandler,
        StrengthOrCardioIntentHandler,
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