
const dbHelper = require('./dbHelper');

// Function to calculate cosine similarity
function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
        return 0; // Avoid division by zero
    }

    return dotProduct / (normA * normB);
}

// Fitness level mapping
const fitnessLevelMap = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3
};

// Fitness goal mapping
const fitnessGoalMap = {
    'muscle gain': 1,
    'weight loss': 2
};

// Find the most similar user
var findMostSimilarUser= async function (targetUser) {

    
    var data= await dbHelper.getAllUsers()
    var usersArray=Object.values(data)

    let mostSimilarUser = null;
    let highestSimilarity = -1;

    // Convert target user data to a vector
    const vectorTargetUser = [
        targetUser.age,
        targetUser.bmi, 
        fitnessLevelMap[targetUser.fitnessLevel] // Map fitness level to numerical value
    ];

    for (const user of usersArray) {
           if (targetUser.gender !== user.gender || targetUser.fitnessGoal !== user.fitnessGoal) {
            continue; // Skip users with different gender and different fitnessGoal
        }
        // Convert current user data to a vector
        const vectorCurrentUser = [
            user.age,
            user.bmi, 
            fitnessLevelMap[user.fitnessLevel] // Map fitness level to numerical value
        ];

        // Calculate cosine similarity
        const similarity = cosineSimilarity(vectorTargetUser, vectorCurrentUser);

        // Check if the current user is more similar than the previous most similar user
        if (similarity > highestSimilarity) {

            highestSimilarity = similarity;
            console.log(highestSimilarity)
            if(highestSimilarity>=0.999)
                 mostSimilarUser = user;
        }
    }

    return mostSimilarUser;
}


module.exports=findMostSimilarUser


