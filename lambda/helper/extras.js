// const GetNameIntentHandler = {
//     canHandle(handlerInput) {
//       return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetNameIntent';
//     },
//     handle(handlerInput) {
//       const { slots } = handlerInput.requestEnvelope.request.intent;
//       const name = slots.name.value;
//       userInfo.name= name;
      
//       return handlerInput.responseBuilder
//         .speak(`Nice to meet you ${name}. How old are you?`)
//         .reprompt("Please tell me your age.")
//         .getResponse();
//     }
//   };
  
  
//   const GetAgeIntentHandler = {
//     canHandle(handlerInput) {
//       return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetAgeIntent';
//     },
//     handle(handlerInput) {
//       const { slots } = handlerInput.requestEnvelope.request.intent;
//       const age = slots.age.value;
//       if(!age || age>150){
//         return handlerInput.responseBuilder
//         .speak("provide a valid value for your age")
//         .getResponse()
  
//       }
//       userInfo.age=age;
  
//       return handlerInput.responseBuilder
//         .speak(`Got it. Your age is ${age}. What is your gender?`)
//         .reprompt("Please tell me your gender.")
//         .getResponse();
//     }
//   };
  
//   // Handler for GetGenderIntent
//   const GetGenderIntentHandler = {
//     canHandle(handlerInput) {
//       return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetGenderIntent';
//     },
//     handle(handlerInput) {
//       const { slots } = handlerInput.requestEnvelope.request.intent;
//       const gender = slots.gender.value;
//       userInfo.gender=gender;
  
//       return handlerInput.responseBuilder
//         .speak(`Understood. Your gender is ${gender}. Please provide your height in centimeters?`)
//         .reprompt("Please tell me your height.")
//         .getResponse();
//     }
//   };

//   // Handler for the BMIIntent
// const HeightIntentHandler = {
//     canHandle(handlerInput) {
//       return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HeightIntent';
//     },
//     handle(handlerInput) {
      
//       var heightSlot = handlerInput.requestEnvelope.request.intent.slots.height.value;
  
//       if(heightSlot<100 || heightSlot>300){
//         return handlerInput.responseBuilder
//         .speak("provide a valid value for your height")
//         .getResponse();
//       }
  
//       userInfo.height=heightSlot;
//       const speechText =`Your height has been recorded as ${heightSlot} centimetres, Please provide your weight in kilograms` 
  
//       return handlerInput.responseBuilder
//         .speak(speechText)
//         .reprompt(speechText)
//         .getResponse();
//     },
//   };
  
//   const WeightIntentHandler = {
//     canHandle(handlerInput) {
//       return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WeightIntent';
//     },
//     handle(handlerInput) {
//       var weightSlot = handlerInput.requestEnvelope.request.intent.slots.weight.value;
  
//       if(weightSlot<20 || weightSlot>200){
//         return handlerInput.responseBuilder
//         .speak("provide a valid value for your weight")
//         .getResponse();
//       }
       
  
//       userInfo.weight=weightSlot;
  
//       bmi = skillUtils.calculateBMI(userInfo.height, userInfo.weight);
//       userInfo.bmi=bmi
  
//       var speechText =`Your weight has been recorded as ${weightSlot} kilograms, ` 
//       speechText += ` Your BMI is ${bmi}. your fitness goal falls under which category, Muscle gain or weight loss.`;
  
//       return handlerInput.responseBuilder
//         .speak(speechText)
//         .reprompt(speechText)
//         .getResponse();
//     },
//   };

//   const YesIntentHandler = {
//     canHandle(handlerInput) {
//       return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
//     },
//     handle(handlerInput) {
//       const speechText = `Great! How many workouts did you do during the session`;
//       const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
//       sessionAttributes.currentWorkout=0;
//       handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
//       return handlerInput.responseBuilder
//         .speak(speechText)
//         .reprompt(speechText)
//         .getResponse();
  
//     }
//   };


// const updateWorkoutDbHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//             && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UpdateWorkoutDbIntent';
//     },
//     handle(handlerInput) {
  
//       skillUtils.workoutdata.forEach((workout)=> {dbHelper.updateWorkoutdb(workout)})
  
//         return handlerInput.responseBuilder
//             .speak("updated")
//             .reprompt("updated")
//             .getResponse();
//     }
//   };






const recordWorkoutIntentHandler={
    canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'recordWorkoutIntent';
    },
    handle(handlerInput) {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      const request=handlerInput.requestEnvelope.request
      var noofworkouts = handlerInput.requestEnvelope.request.intent.slots.noofworkouts.value
     // var workoutname = handlerInput.requestEnvelope.request.intent.slots.workoutname.value
  
     return handlerInput.responseBuilder
        .speak(`${noofworkouts} workouts ----`)
        .getResponse()
  
      // var currentIntent=request.intent
      // if (request.dialogState && request.dialogState !== 'COMPLETED') {
      //   return handlerInput.responseBuilder
      //     .addDelegateDirective(currentIntent)
      //     .getResponse();
      // }
  
      // let i=sessionAttributes.currentWorkout
      // console.log(noofworkouts)
  
      // if(noofworkouts!=null)
      // {
      // sessionAttributes.noofworkouts=noofworkouts;
      // handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
      // }
  
      // if(workoutname){
      //   workouts[i]={}
      //   workouts[i]['workoutname']=workoutname
      // }
  
      // if(i<sessionAttributes.noofworkouts)
      // {
      //   let speechText=''
      //   switch(i+1){
      //     case 1: speechText='<speak>Please start by saying the 1st workout name which you did</speak>';break;
      //     case 2: speechText = `<speak>what was the 2nd workout did you do</speak>`;break;
      //     case 3: speechText = `<speak>what was the 3rd workout did you do</speak>`;break;
      //     default: speechText = `<speak>what was the ${i+1}th workout did you do</speak>`;
      //   }
        
      //   sessionAttributes.currentWorkout= sessionAttributes.currentWorkout + 1;
      //   return handlerInput.responseBuilder
      //     .speak(speechText)
      //     .reprompt(speechText)
      //     .getResponse();
        
      // }
      // console.log(workouts)
      // sessionAttributes.currentWorkout=1;
      // return handlerInput.responseBuilder
      //     .speak(`Great! Next we will start recording more details on each workout. how many sets of ${workouts[1]['workoutname']} did you do and how many reps did you do for each set`)
      //     .getResponse();
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
                let scheduleData= await dbHelper.getWorkoutSchedule(existingUser.userId,existingUser.personId)
                  workoutPlan=scheduleData.workout;
                    console.log(workoutPlan)
                    var re= await emailer(1,handlerInput,workoutPlan)
                    console.log(re)
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                    speechText = `your personalized workout plan has been mailed to you`;
                    sessionAttributes.previouslySaid=speechText;break;
  
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
        // case '2': const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      //            sessionAttributes.currentWorkout=0;
      //            handlerInput.attributesManager.setSessionAttributes(sessionAttributes)
      //              return handlerInput.responseBuilder
      //           .addDelegateDirective(
      //           {
      //             name: 'recordWorkoutIntent',
      //             confirmationStatus: 'NONE',
      //             slots: {}
      //          })
      //             .getResponse();

      // var userInfo ={
//   userId:'',
//   personId:'',
//   name:'',
//   age:'',
//   gender:'',
//   height:'',
//   weight:'',
//   fitnessGoal:'',
//   bmi:'',
//   fitnessLevel:''
// }