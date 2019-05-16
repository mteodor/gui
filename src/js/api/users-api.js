var request = require('superagent-use')(require('superagent'));
require('superagent-auth-bearer')(request);
var Promise = require('es6-promise').Promise;
import cookie from 'react-cookie';
import { unauthorizedRedirect } from '../auth';

request.use(unauthorizedRedirect);

const Api = {
  get: url => {
    var token = cookie.load('JWT');
    return new Promise((resolve, reject) => {
      request
        .get(url)
        .authBearer(token)
        .end((err, res) => {
          if (err || !res.ok) {
            reject({ error: err, res: res });
          } else {
            resolve(res.body);
          }
        });
    });
  },
  postLogin: (url, userData) => { 
    return new Promise((resolve, reject) => {
      request
        .post(url)
        .auth(userData.email, userData.password)
        .set('Content-Type', 'application/jwt')
        .end((err, res) => {
          if (err || !res.ok) {
            var errorResponse = {
              text: err.response ? JSON.parse(err.response.text) : err,
              code: err.status
            };
            reject({ error: errorResponse, res: res });
          } else {
            var response = {
              text: res.text,
              code: res.status
            };
            resolve(response);
          }
        });
    });
  },
  getLogin: (url) => {
    console.log('getLogin SSO:' + url);
    return new Promise((resolve, reject) => {
      request
        .get(url)
        .end((err, res) => {
          var errorResponse;
          if (err || !res.ok ) {
            var status = err.status === 'undefined'? 401 : err.status;
            errorResponse = {
              text: err.response ? JSON.parse(err.response.text) : err,
              code: status
            };
            console.log('error status:' + status);
            reject({ error: errorResponse, res: res });
          } else {
            console.log('result status:' + res.status);
            console.log('result type:' +  res.type);

            if (res.type !== 'application/jwt') {
              errorResponse = {
                text: 'Not authenticated, response must be jwt',
                code: 401
              };
              reject({ error:errorResponse, res: res });
            }
            var response = {
              text: res.text,
              code: res.status
            };
            resolve(response);
          }
        });
    });
  },
  
  post: (url, userData) => {
    return new Promise((resolve, reject) => {
      var token = cookie.load('JWT');
      request
        .post(url)
        .authBearer(token)
        .set('Content-Type', 'application/json')
        .send(userData)
        .end((err, res) => {
          if (err || !res.ok) {
            reject({ error: err, res: res });
          } else {
            resolve(res.header);
          }
        });
    });
  },
  put: (url, userData) => {
    return new Promise((resolve, reject) => {
      var token = cookie.load('JWT');
      request
        .put(url)
        .authBearer(token)
        .set('Content-Type', 'application/json')
        .send(userData)
        .end((err, res) => {
          if (err || !res.ok) {
            reject({ error: err, res: res });
          } else {
            resolve(res.header);
          }
        });
    });
  },
  delete: url => {
    var token = cookie.load('JWT');
    return new Promise((resolve, reject) => {
      request
        .del(url)
        .authBearer(token)
        .end((err, res) => {
          if (err || !res.ok) {
            reject({ error: err, res: res });
          } else {
            resolve(res.header);
          }
        });
    });
  }
};

export default Api;
