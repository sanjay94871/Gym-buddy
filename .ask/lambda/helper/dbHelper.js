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

//Registering New User
dbHelper.prototype.regUser = (userInfo) => {
    return new Promise((resolve, reject) => {
        

        // Save the user ID to DynamoDB
        const params = {
            TableName: usertable,
            Item: {
                userId: userInfo.userId,
                name: userInfo.name,
                age: userInfo.age,
                gender: userInfo.gender,
                height: userInfo.height,
                weight: userInfo.weight,
                fitnessGoal: userInfo.fitnessGoal,
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
dbHelper.prototype.getUserFromDynamoDB=async (userId) =>{
    try {
        const params = {
          TableName: usertable, // Replace with your DynamoDB table name
          Key: { userId }
        };
    
        const data = await docClient.get(params).promise();
        return data.Item;
      } catch (error) {
        console.error('Error retrieving user data:', error);
        return null;
      }

}


dbHelper.prototype.storeWorkoutinDB = (userId,workoutdict) => {
    return new Promise((resolve, reject) => {
    const params = {
        TableName: 'WorkoutRecord',
        Item: {
            userId: userId,
            createdOn: new Date().toISOString(),
            workouts:workoutdict
        },
    };

    try {
        docClient.put(params).promise();
        console.log('workouts saved to DynamoDB:', userId);
    } catch (error) {
        console.error('Error saving user ID to DynamoDB:', error);
    }
});
}

module.exports = new dbHelper();