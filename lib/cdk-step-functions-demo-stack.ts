import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';
import * as stepfunctions from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';

export class LuckyNumber extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    /* DYNAMODB TABLE */

    const scoreTable = new dynamodb.Table(this, 'LuckyNumberScore', {
      partitionKey: { name: 'contestant', type: dynamodb.AttributeType.STRING }
    });


    /* LAMBDAS */

    const newGameLambda = new lambda.Function(this, 'NewGameLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'new-game.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/new-game')),
    });
    newGameLambda.addEnvironment('SCORE_TABLE', scoreTable.tableName)
    scoreTable.grantReadWriteData(newGameLambda);
    
    const drawLambda = new lambda.Function(this, 'DrawLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'draw.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/draw')),
    });

    const incrementOneScoreLambda = new lambda.Function(this, 'IncrementOneScoreLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'increment-one-score.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/increment-one-score')),
    });
    incrementOneScoreLambda.addEnvironment('SCORE_TABLE', scoreTable.tableName)
    scoreTable.grantReadWriteData(incrementOneScoreLambda);

    const incrementTwoScoreLambda = new lambda.Function(this, 'IncrementTwoScoreLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'increment-two-score.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/increment-two-score')),
    });
    incrementTwoScoreLambda.addEnvironment('SCORE_TABLE', scoreTable.tableName)
    scoreTable.grantReadWriteData(incrementTwoScoreLambda);

    const checkScoreboardLambda = new lambda.Function(this, 'CheckScoreboardLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'check-scoreboard.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/check-scoreboard')),
    });
    checkScoreboardLambda.addEnvironment('SCORE_TABLE', scoreTable.tableName)
    scoreTable.grantReadData(checkScoreboardLambda);


    /* STEP FUNCTION */

    const newGame = new tasks.LambdaInvoke(this, 'NewGame', {
      lambdaFunction: newGameLambda
    });

    const draw = new tasks.LambdaInvoke(this, 'Draw', {
      lambdaFunction: drawLambda,
      outputPath: '$.result.Payload',
      resultPath: '$.result'
    });
    draw.addRetry({
      errors: ['States.ALL'],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 3
    })

    const incrementOneScore = new tasks.LambdaInvoke(this, 'IncrementOneScore', {
      lambdaFunction: incrementOneScoreLambda,
      outputPath: '$.result.Payload',
      resultPath: '$.result'
    });

    const incrementTwoScore = new tasks.LambdaInvoke(this, 'IncrementTwoScore', {
      lambdaFunction: incrementTwoScoreLambda,
      outputPath: '$.result.Payload',
      resultPath: '$.result'
    });

    const checkScoreboard = new tasks.LambdaInvoke(this, 'CheckScoreboard', {
      lambdaFunction: checkScoreboardLambda,
      outputPath: '$.winner.Payload',
      resultPath: '$.winner'
    });

    const gameOver = new stepfunctions.Pass(this, 'Game Over');

    const luckyDrawDefinition = newGame
      .next(draw)
      .next(new stepfunctions.Choice(this, 'ExamineResult')
        .when(stepfunctions.Condition.numberEquals('$.result', 1), incrementOneScore)
        .when(stepfunctions.Condition.numberEquals('$.result', 2), incrementTwoScore)
        .afterwards()
        .next(checkScoreboard)
        .next(new stepfunctions.Choice(this, 'DrawAgainOrGameOver')
          .when(stepfunctions.Condition.stringEquals('$.winner', 'one'), gameOver)
          .when(stepfunctions.Condition.stringEquals('$.winner', 'two'), gameOver)
          .otherwise(draw)
        )
      );

    new stepfunctions.StateMachine(this, 'LuckyDraw', {
        definition: luckyDrawDefinition,
        timeout: cdk.Duration.minutes(10)
    });
  }
}
