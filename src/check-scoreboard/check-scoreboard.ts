export {};
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

type Item = {
  contestant: { 
    S: string; 
  }, 
  wins: { 
    N: string; 
  }
}
 
const scanParams = {
  TableName: process.env.SCORE_TABLE
};

exports.handler = async (event: { result: string; }) => {
  return new Promise(async (resolve, reject) => {
    dynamodb.scan(scanParams, (err: any, data: any) => {
      if (err) { 
        reject(false); 
      } else {
        if (data.Items) {
          // check for an overall winner
          data.Items.map((item: Item) => {
              const contestant = item.contestant.S;
              const wins = Number(item.wins.N);
              if (contestant === event.result && wins >= 3) {
                resolve({'winner': contestant});
              }
          }); 
          // no overall winner yet
          resolve({'winner': null});
        } else {
          reject(null);
        }
      }
    });
  });
};
