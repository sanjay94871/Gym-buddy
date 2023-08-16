var AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"});
const maintableName = "workout";
const usertable ="user";

var dbHelper = function () { };
var docClient = new AWS.DynamoDB.DocumentClient();


dbHelper.prototype.getWorkout = () => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: maintableName,
            FilterExpression: '#type = :type1 OR #type = :type2',
            ExpressionAttributeNames: {
                '#type': 'type', 
            },
            ExpressionAttributeValues: {
                ':type1':'cardio',
                ':type2':'strength',
            }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}

dbHelper.prototype.updateWorkoutdb = (workout) => {
    return new Promise((resolve, reject) => {

        const params= {
            TableName:'workout',
            Item:{
                ...workout
            },
        };

        try {
            docClient.put(params).promise();
            console.log('Workout saved to DynamoDB:');
        } catch (error) {
            console.error('Error saving workout to DynamoDB:', error);
        }
    });
}

dbHelper.prototype.regWorkout = (userId, personId, workoutplan) => {
    return new Promise((resolve, reject) => {

        const params= {
            TableName:'schedule',
            Item:{
                userId:userId,
                personId: personId,
                workout: workoutplan
            },
        };

        try {
            docClient.put(params).promise();
            console.log('Workout saved to DynamoDB:');
        } catch (error) {
            console.error('Error saving workout to DynamoDB:', error);
        }
    });
}

dbHelper.prototype.getWorkoutSchedule=async (userId,personId) =>{
    try {
        const params = {
          TableName: "schedule", // Replace with your DynamoDB table name
          Key: {userId, personId}
        };
    
        const data = await docClient.get(params).promise();
        return data.Item;
      } catch (error) {
        console.log('Error retrieving user data:', error);
        return null;
      }

}

//Registering New User
dbHelper.prototype.regUser = (userInfo) => {
    return new Promise((resolve, reject) => {
        

        // Save the user ID to DynamoDB
        const params = {
            TableName: usertable,
            Item: {
                userId: userInfo.userId,
                personId:userInfo.personId,
                name: userInfo.name,
                age: userInfo.age,
                gender: userInfo.gender,
                height: userInfo.height,
                weight: userInfo.weight,
                fitnessGoal: userInfo.fitnessGoal,
                bmi:userInfo.bmi,
                fitnessLevel: userInfo.fitnessLevel,
                createdAt: new Date().toISOString(),
            },
        };
    
        try {
            docClient.put(params).promise();
            console.log('User ID saved to DynamoDB:', userInfo.userId);
        } catch (error) {
            console.error('Error saving user ID to DynamoDB:', error);
        }
    });
}

//Check the existing user and get data associated
dbHelper.prototype.getUserFromDynamoDB=async (userId,personId) =>{
    try {
        const params = {
          TableName: usertable, // Replace with your DynamoDB table name
          Key: {userId, personId}
        };
    
        const data = await docClient.get(params).promise();
        return data.Item;
      } catch (error) {
        console.log('Error retrieving user data:', error);
        return null;
      }

}


dbHelper.prototype.storeWorkoutinDB = (userId,personId,workoutdict) => {
    return new Promise((resolve, reject) => {
        var currentDate=new Date()
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        var dateString = currentDate.toLocaleDateString('en-US', options);
    
        const params = {
        TableName: 'WorkoutRecord',
        Item: {
            userId: userId,
            personId:personId,
            createdOn: new Date().toISOString(),
            workouts:workoutdict
        },
    };

    try {
        docClient.put(params).promise();
        console.log('Recorded workouts saved to DynamoDB:', userId);
    } catch (error) {
        console.error('Error saving user ID to DynamoDB:', error);
    }
});
}

dbHelper.prototype.getRecordedWorkouts = async (userId,personId) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: 'WorkoutRecord',
            FilterExpression: '#userId = :userId AND #personId = :personId',
            ExpressionAttributeNames: {
                '#userId': 'userId', 
                '#personId':'personId'
            },
            ExpressionAttributeValues: {
                ':userId':userId,
                ':personId':personId,
            }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("GetRecordedWorkout succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}


module.exports = new dbHelper();