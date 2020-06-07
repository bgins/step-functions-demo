export {};

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Draw a number between 1 and 6 once per second.
 * If number is 1 or 2, resolve with it.
 * Keep trying until the lambda times out.
*/
exports.handler = async () => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
       const draw = getRandomInt(1,6);
       if (draw === 1 || draw === 2) {
         clearInterval(interval);
         resolve({result: draw});
       } 
    }, 1000);
  });
};