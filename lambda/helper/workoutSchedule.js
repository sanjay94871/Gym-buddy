const dbHelper= require("./dbHelper")

var scheduleTable= function (workoutData) {
    let htmlTable = '<table border="1">';
    htmlTable += '<tr><th>Day</th><th>Workout</th><th>Target</th><th>Sets&Reps/Time</th></tr>';
    
    for (const day in workoutData) {

      const workouts = workoutData[day];
      if(workouts.length==0){
        htmlTable+=`<tr ><td>${day}</td><td colspan='4'>Rest Day</td></tr>`
      }
      else{
      htmlTable+=`<tr ><td rowspan='5'>${day}</td>`
      workouts.forEach((workout) => {
        if(workout.muscle==="cardio")
          htmlTable += `<td>${workout.workout}</td><td>${workout.muscle}</td><td>${workout.time} mins</td></tr><tr>`;
        else
          htmlTable += `<td>${workout.workout}</td><td>${workout.muscle}</td><td>${workout.sets} sets of ${workout.reps} reps</td></tr><tr>`;
      });
    }
    }
  
    htmlTable += '</table>';
  
  
  // Generate the HTML content with the workout table
  return htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Workout Schedule</title>
  </head>
  <body>
    <h1>Workout Schedule</h1>
    ${htmlTable}
  </body>
  </html>
  `;

}
 

var recordTable= function (workoutData) {

  

    let htmlTable = '<table border="1">';
    htmlTable += '<tr><th>Day</th><th>Workout</th><th>Sets&Reps/Time</th></tr>';
  
    for (const [key,value] of Object.entries(workoutData)) {

    var currentDate=new Date(value.createdOn)
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    var dateString = currentDate.toLocaleDateString('en-US', options);
      
      const workouts = value.workouts;
      htmlTable+=`<tr ><td rowspan='${Object.keys(workouts).length}'>${dateString}</td>`
      Object.values(workouts).forEach((workout) => {
        if(workout.type==="cardio")
          htmlTable += `<td>${workout.workoutname}</td><<td>${workout.time}</td></tr><tr>`;
        else
          htmlTable += `<td>${workout.workoutname}</td><td>${workout.sets} sets of ${workout.reps} reps</td></tr><tr>`;
      });
    
    }
  
    htmlTable += '</table>';
  
  
  // Generate the HTML content with the workout table
  return htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Progress Report</title>
  </head>
  <body>
    <h1>Progress Report</h1>
    ${htmlTable}
  </body>
  </html>
  `;

}


module.exports={scheduleTable, recordTable}