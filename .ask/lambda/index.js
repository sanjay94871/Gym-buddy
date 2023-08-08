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

// Handler for the LaunchRequest
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const {user,person}=handlerInput.requestEnvelope.context.System
    const userId = user.userId;
    const personId=(person)?(person.personId):"null";
    console.log(personId)
    
    existingUser = await dbHelper.getUserFromDynamoDB(userId,personId);
    if(existingUser){
      const speechText =`<speak>Welcome Back ${existingUser.name}. How can I assist you. Choose an option from 1-4. 1. Update your profile,\n 2. Record a workout,\n 3. Get previous workout report,\n 4. Get workout schedule</speak>`;
      return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
    }
    else{
    const speechText = 'Welcome to the Gym Workout Planner. We will start by creating a profile for you. Please start by saying your name';
    userInfo.userId = userId
    userInfo.personId=personId
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
    }
  },
};

const LaunchOptionIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LaunchOptionIntent';
  },
  handle(handlerInput) {

    const option = handlerInput.requestEnvelope.request.intent.slots.option.value;

    switch(option){
      case '1':speechText = skillUtils.updateProfPrompt(existingUser);break;
      case '2':speechText = `Great! How many workouts did you do during the session`;
              const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
              sessionAttributes.currentWorkout=0;
              handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
              break;
      case '3':
      case '4': let workoutPlan='';
              return dbHelper.getWorkout()
              .then((data)=>{
                  workoutPlan=workoutG(data,existingUser.fitnessGoal)
                  console.log(workoutPlan);
                  emailer(handlerInput,workoutPlan);
                  const speechText = `your personalized workout plan has been mailed to you`;
   
                  return handlerInput.responseBuilder
                    .speak(speechText)
                    .reprompt(speechText)
                    .getResponse();})
    }

    return handlerInput.responseBuilder
    .speak(speechText)
      .reprompt(speechText)
      .getResponse();
    
  }
}

const updateProfileIntentHandler= {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UpdateProfileIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    var attribute= slots.attribute.value

   attribute=(attribute==='fitness goal')?('fitnessGoal'):attribute
   attribute=(attribute==='fitness level')?('fitnessLevel'):attribute

   var fil= Object.fromEntries(Object.entries(slots).filter(([key, value]) => value.hasOwnProperty('value') && (key!=='attribute')));
   var change= Object.values(fil)[0].value
 
  existingUser[attribute]=change

  if(attribute==="height" || attribute==="weight"){
    existingUser['bmi']=skillUtils.calculateBMI(existingUser.height,existingUser.weight)
  }

    dbHelper.regUser(existingUser);
   return handlerInput.responseBuilder
      .speak(`Alright. Your ${attribute} has been updated to ${change} `)
      .reprompt(`Alright. Your ${attribute} has been updated to ${change} `)
      .getResponse();
  }

}


const GetNameIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetNameIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const name = slots.name.value;
    userInfo.name= name;
    // Save the name in your data store or session attributes.
    // You can use the Alexa SDK persistence adapter to save the data between sessions.
    return handlerInput.responseBuilder
      .speak(`Nice to meet you ${name}. How old are you?`)
      .addElicitSlotDirective('age')
      .reprompt("Please tell me your age.")
      .getResponse();
  }
};

const GetAgeIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetAgeIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const age = slots.age.value;
    userInfo.age=age;

    return handlerInput.responseBuilder
      .speak(`Got it. Your age is ${age}. What is your gender?`)
      .reprompt("Please tell me your gender.")
      .getResponse();
  }
};

// Handler for GetGenderIntent
const GetGenderIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetGenderIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const gender = slots.gender.value;
    userInfo.gender=gender;

    return handlerInput.responseBuilder
      .speak(`Understood. Your gender is ${gender}. Please provide your height in centimeters and weight in kilograms?`)
      .reprompt("Please tell me your height.")
      .getResponse();
  }
};

const YesIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const speechText = `Great! How many workouts did you do during the session`;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.currentWorkout=0;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();

  }
};

var workouts = {};
const recordWorkoutIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'recordWorkoutIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var noofworkouts = handlerInput.requestEnvelope.request.intent.slots.noofworkouts.value
    var workoutname = handlerInput.requestEnvelope.request.intent.slots.workoutname.value

    let i=sessionAttributes.currentWorkout

    if(noofworkouts!=null)
    {
    sessionAttributes.noofworkouts=noofworkouts;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    }

    if(workoutname){
      workouts[i]={}
      workouts[i]['workoutname']=workoutname
    }

    if(i<sessionAttributes.noofworkouts)
    {
      let speechText=''
      switch(i+1){
        case 1: speechText='<speak>Please start by saying the 1st workout name which you did</speak>';break;
        case 2: speechText = `<speak>what was the 2nd workout did you do</speak>`;break;
        case 3: speechText = `<speak>what was the 3rd workout did you do</speak>`;break;
        default: speechText = `<speak>what was the ${i+1}th workout did you do</speak>`;
      }
      
      sessionAttributes.currentWorkout= sessionAttributes.currentWorkout + 1;
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
      
    }
    console.log(workouts)
    sessionAttributes.currentWorkout=1;
    return handlerInput.responseBuilder
        .speak(`Great! Next we will start recording more details on each workout. how many sets of ${workouts[1]['workoutname']} did you do and how many reps did you perform for each set`)
        .reprompt(`Great! Next we will start recording more details on each workout. how many sets of ${workouts[1]['workoutname']} did you do and how many reps did you perform for each set`)
        .getResponse();
    }
};

const WorkoutDetailsIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WorkoutDetailsIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const userId = handlerInput.requestEnvelope.context.System.user.userId;
    
    var sets=handlerInput.requestEnvelope.request.intent.slots.sets.value
    var reps=handlerInput.requestEnvelope.request.intent.slots.reps.value
    let currentWorkout=sessionAttributes.currentWorkout;

    workouts[currentWorkout]['sets']=sets
    workouts[currentWorkout]['reps']=reps
    currentWorkout=currentWorkout+1
       
    if(currentWorkout<=Object.keys(workouts).length)
    {
    const speechText=`Cool! how many sets of ${workouts[currentWorkout]['workoutname']} did you do and how many reps did you perform for each set` 
    sessionAttributes.currentWorkout=currentWorkout
    return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse(speechText);
    }
    else{
      console.log(workouts)
      dbHelper.storeWorkoutinDB(userId,workouts)
      const speechText="Your workouts have been recorded"
      return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse(speechText);
        
    }

  }
}

// Handler for the BMIIntent
const BMIIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BMIIntent';
  },
  handle(handlerInput) {
    
    var heightSlot = handlerInput.requestEnvelope.request.intent.slots.height.value;
    var weightSlot = handlerInput.requestEnvelope.request.intent.slots.weight.value;

    // Calculate the BMI based on the provided height and weight
    bmi = skillUtils.calculateBMI(heightSlot,weightSlot);

    userInfo.height=heightSlot;
    userInfo.weight=weightSlot;
    userInfo.bmi=bmi

    const speechText = `Great!Your BMI is ${bmi}. Please provide your fitness goal to get a personalized workout plan.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};


const GoalIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GoalIntent';
  },
  async handle(handlerInput) {
    var fitnessGoalSlot = handlerInput.requestEnvelope.request.intent.slots.goal.value;
    userInfo.fitnessGoal=fitnessGoalSlot;

        
    const speechText = `Cool! How would rate your current fitness level as Beginner or Intermediate or Expert`;
   
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse(); 
      
  },
};

const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const d = new Date();
let day = weekday[d.getDay()];
let workoutPlan='';

const FitnessLevelIntent ={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FitnessLevelIntent';
  },
  async handle(handlerInput) {
    var fitnessLevel = handlerInput.requestEnvelope.request.intent.slots.fitnessLevel.value;
    userInfo.fitnessLevel=fitnessLevel
    dbHelper.regUser(userInfo);

    
    return dbHelper.getWorkout()
    .then((data)=>{
        workoutPlan=workoutG(data,userInfo.fitnessGoal)
        console.log(workoutPlan);
        emailer(handlerInput,workoutPlan);
        dbHelper.regWorkout(userInfo.userId,userInfo.personId, workoutPlan)

        const speechText = `<speak>Based on your Fitness level and Fitness Goal, a personalized workout plan has been mailed to you. Today's ${day}, if you wanna start today's workout now, try saying "start the workout"</speak>`;
        return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse(); })

  }
}

const WorkoutIntentHandler={
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WorkoutIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var control = handlerInput.requestEnvelope.request.intent.slots.control.value;
    var workout=workoutPlan[day]
    var workoutCount= workout.length
    if(control==="start"){
      if(workout[0]['muscle']==="cardio")
         var speechText=`start the workout with ${workout[0]['workout']} for ${workout[0]['time']} mins`
      else
        var speechText=`start the workout with ${workout[0]['workout']} doing ${workout[0]['sets']} of ${workout[0]['reps']}`
      sessionAttributes.workoutno=1
    }
    else if(control==="next" && sessionAttributes.workoutno<workoutCount){
      var i= sessionAttributes.workoutno;
      if(workout[i]['muscle']==="cardio")
        var speechText=`next workout is ${workout[i]['workout']} for ${workout[i]['time']} mins`
      else
        var speechText=`next workout is ${workout[i]['workout']} doing ${workout[i]['sets']} sets of ${workout[i]['reps']} reps`
        sessionAttributes.workoutno=i+1

    }
    else{
      var speechText="End of today's workout session"
    }


    return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(speechText)
    .getResponse(); 

  }


}

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
        const speakOutput = 'Goodbye!';

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
    .addRequestHandlers(
        LaunchRequestHandler,
        BMIIntentHandler,
        HelpIntentHandler,
        LaunchOptionIntentHandler,
        updateProfileIntentHandler,
        GetNameIntentHandler,
        GetAgeIntentHandler,
        GetGenderIntentHandler,
        recordWorkoutIntentHandler,
        WorkoutDetailsIntentHandler,
        WorkoutIntentHandler,
        YesIntentHandler,
        GoalIntentHandler,
        FitnessLevelIntent,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();