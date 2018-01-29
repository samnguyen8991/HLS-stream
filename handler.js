'use strict';
const moment = require('moment');
const fs = require('fs');

module.exports.stream = (event, context, callback) => {
  let now = moment();
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,ETag,Content-Length,Content-Range',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Origin': '*',
    }
  };

  //check if starting time has been passed as parameters
  if (event.queryStringParameters
      && event.queryStringParameters.start) {
    let start = moment(event.queryStringParameters.start,
                        moment.HTML5_FMT.TIME_SECONDS); // eg "10:55:26"
    let diff = now.diff(start, 'seconds') //diff between now and start
    let txt = fs.readFileSync('clock.m3u8').toString().split('\r\n');
    //include header
    let res = txt[0] + '\r\n' + '#EXT-X-PLAYLIST-TYPE:EVENT' + '\r\n'
              + txt[1] + '\r\n' + '#EXT-X-MEDIA-SEQUENCE:0' + '\r\n';

    //include video chunk
    if (diff < 0) {
      response.statusCode = 400;
      response.body = JSON.stringify({ error: "Start time > current time" })
    } else {
      let chunkNum = Math.floor(diff/10 + 1);
      console.log(chunkNum);

      for (let i=2; i <= 2*chunkNum; i+=2) {
        if (txt[i] === '#EXT-X-ENDLIST') {
          break;
        }
        res += txt[i] + '\r\n';
        res += 'https://s3.amazonaws.com/hls-stream-dev-serverlessdeploymentbucket-15fggvnar553e/media/'
            + txt[i+1] + '\r\n';
      }

      response.body = res;
    }
  } else {
    response.statusCode = 400;
    response.body = JSON.stringify({ error: "Starting time needed" })
  }

  callback(null, response);
};
