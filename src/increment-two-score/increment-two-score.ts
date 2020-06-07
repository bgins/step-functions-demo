export {};
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

const queryParams = {
  ExpressionAttributeValues: {
   ':contestant': {
      S: 'two'
    }
  }, 
  KeyConditionExpression: 'contestant = :contestant',
  TableName: process.env.SCORE_TABLE
 };
 
const getUpdateParams = (updatedWins: number) => {
  return {
    ExpressionAttributeNames: {
      '#wins': 'wins'
    },
    ExpressionAttributeValues: {
      ':wins': {
        N: String(updatedWins)
      } 
    },
    Key: {
      contestant: {
        S: 'two' 
      }
    },
    UpdateExpression: 'SET #wins = :wins',
    TableName: process.env.SCORE_TABLE
  };
};

exports.handler = async () => {
  return new Promise(async (resolve, reject) => {
    dynamodb.query(queryParams, (err: any , data: any) => {
      if (err) { 
        reject(err); 
      } else {
        if (data.Items.length === 1 && data.Items[0].contestant.S === 'two') {
          const updatedWins = Number(data.Items[0].wins.N) + 1;
          const updateParams = getUpdateParams(updatedWins);
          dynamodb.updateItem(updateParams, (err: any, data: any) => {
            if (err) { reject(err); }
            resolve({'result': 'two'});
          });
        } else {
          reject(null);
        }
      }
    });
  });
};
