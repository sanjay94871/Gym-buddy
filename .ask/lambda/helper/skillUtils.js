

// Helper function to calculate the BMI
function calculateBMI(height, weight) {
    // Convert height to meters and weight to kilograms
    const heightInMeters = height / 100;
    const weightInKilograms = weight;
  
    // Calculate BMI using the formula: weight (kg) / (height (m))^2
    const bmi = weightInKilograms / (heightInMeters * heightInMeters);
  
    // Round the BMI to two decimal places
    return bmi.toFixed(2);
  }


  async function getExercise(){
    let workoutPlan = '';
    let type="1";
    await dbHelper.getWorkout(type)
    .then((data)=>{
        workoutPlan=data[0].type;
        console.log(data[0].type);
        return workoutPlan;
        })
   
}

function updateProfPrompt(user){
  return speechText=`Based on your profile, your name is ${user.name}, you are ${user.gender} and ${user.age} years old. your height is ${user.height} centimetres, weight is ${user.weight} kilograms and your fitness goal is ${user.fitnessGoal}. To update any of this, For example to update your age, Please say update my age to and the new value followed by it` 
}

function generateWorkoutPlan(bmi, fitnessGoal) {
  let workoutPlan = '';

  // Generate workout plan based on BMI and fitness goal
  if (fitnessGoal === 'weight loss') {
    if (bmi < 18.5) {
      workoutPlan = 'Your workout plan should focus on building muscle mass and increasing calorie intake.';
    } else if (bmi >= 18.5 && bmi < 25) {
      workoutPlan = 'Your workout plan should include a combination of cardio exercises and strength training to burn fat and maintain muscle mass.';
    } else {
      workoutPlan = 'Your workout plan should primarily focus on cardio exercises to burn excess fat.';
    }
  } else if (fitnessGoal === 'muscle gain') {
    if (bmi < 18.5) {
      workoutPlan = 'Your workout plan should focus on building muscle mass and increasing calorie intake.';
    } else if (bmi >= 18.5 && bmi < 25) {
      workoutPlan = 'Your workout plan should include a combination of strength training exercises targeting different muscle groups.';
    } else {
      workoutPlan = 'Your workout plan should include a combination of strength training exercises and a high-calorie diet to support muscle growth.';
    }
  } else {
    workoutPlan = 'Your fitness goal is not recognized. Please specify a valid fitness goal.';
  }

  return workoutPlan;
}

  module.exports={calculateBMI,getExercise,updateProfPrompt}