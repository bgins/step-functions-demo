export {};
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

const getUpdateParams = (contestant: string) => {
  return {
    ExpressionAttributeNames: {
      '#wins': 'wins'
    },
    ExpressionAttributeValues: {
      ':wins': {
        N: '0'
      } 
    },
    Key: {
      'contestant': {
        S: contestant
      }
    },
    UpdateExpression: 'SET #wins = :wins',
    TableName: process.env.SCORE_TABLE
  };
};

exports.handler = async () => {
  return new Promise(async (resolve, reject) => {
    // reset one's score to zero
    const resetOneScoreParams = getUpdateParams('one');
    dynamodb.updateItem(resetOneScoreParams, (err: any, data: any) => {
      if (err) { 
        reject(err); 
      } else {
        // reset two's score to zero
        const resetTwoScoreParams = getUpdateParams('two');
        dynamodb.updateItem(resetTwoScoreParams, (err: any, data: any) => {
          if (err) { reject(err); }
          resolve("Scoreboard initialized");
        });
      }
    });
  });
};
