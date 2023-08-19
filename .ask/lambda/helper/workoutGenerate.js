var workoutG = function (data,fitnessGoal,fitnessLevel) {
    var daysofWeek = [
        { day: 'Monday', muscle: 'chest' },
        { day: 'Tuesday', muscle: 'lats' },
        { day: 'Wednesday', muscle: 'quadriceps' },
        { day: 'Thursday', muscle: 'biceps' },
        { day: 'Friday', muscle: 'triceps' },
        { day: 'Saturday', muscle: 'rest' },
        { day: 'Sunday', muscle: 'rest' },
      ];
    let workoutPlan = {};

    var level={
      'beginner':1,
      'intermediate':2,
      'expert':3
    }

      if(level[fitnessLevel]==3){
        var counts= (fitnessGoal==="muscle gain")?{'strengthcount':6,'cardiocount': 2}:{'strengthcount':3,'cardiocount':5};
        var sr={sets:'4',reps:'12-15',time:20}
      }
      else if(level[fitnessLevel]==2){
        var counts= (fitnessGoal==="muscle gain")?{'strengthcount':5,'cardiocount': 2}:{'strengthcount':3,'cardiocount':4};
        var sr={sets:'4',reps:'12',time:20}
      }
      else{
        var counts= (fitnessGoal==="muscle gain")?{'strengthcount':3,'cardiocount': 2}:{'strengthcount':2,'cardiocount':3};
        var sr={sets:'3',reps:'10',time:10}
      }
    

   

    var countcopy={...counts};
    daysofWeek.forEach((days) => {
      workoutPlan[days.day] = [];
      for (const workout of data) {
        if(level[fitnessLevel]>=level[workout.difficulty]){
        if (workout.type === 'strength' && counts.strengthcount > 0 && workout.muscle == days.muscle) {
          workoutPlan[days.day].push({ 'workout': workout.name,'muscle':days.muscle, 'sets': sr.sets, 'reps': sr.reps, 'instructions':workout.instructions});
          counts.strengthcount--;
        }
        if (workout.type === 'cardio' && counts.cardiocount > 0 && days.muscle!='rest') {
          workoutPlan[days.day].push({ 'workout': workout.name,'muscle':'cardio', 'time':sr.time, 'instructions':workout.instructions});
          counts.cardiocount--;
        }
      
          }
        }
        counts={...countcopy};
    
    });
  
    return workoutPlan;
  }
  
  module.exports = workoutG;
  