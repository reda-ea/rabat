
/* global expect */

const request = require('supertest');

const Response = require('../src/response');

let serve = response => request(response.send.bind(response));

describe('default constructed response', () => {
  it('defaults to 404', async () => {
    let response = new Response();
    let output = await serve(response).get('/');
    expect(output.status).toBe(404);
  });

  it('takes error as first argument', async () => {
    let response = new Response('hello world');
    let output = await serve(response).get('/');
    expect(output.status).toBe(500);
    expect(output.text).toBe('hello world');
  });

  it('takes non-error response as second argument', async () => {
    let response = new Response(null, 'hello world');
    let output = await serve(response).get('/');
    expect(output.status).toBe(200);
    expect(output.text).toBe('hello world');
  });

  it('sets text content type for strings', async () => {
    let response = new Response(null, 'hello world');
    let output = await serve(response).get('/');
    expect(output.type).toBe('text/plain');
  });

  it('sets json content type for objects', async () => {
    let response = new Response(null, {hello:  'world'});
    let output = await serve(response).get('/');
    expect(output.type).toBe('application/json');
  });

  it('allows custom response', async () => {
    let response = new Response(null, (req, res, next) => {
      res.statusCode = 211;
      res.setHeader('x-hello', 'world');
      res.end();
    });
    let output = await serve(response).get('/');
    expect(output.status).toBe(211);
    expect(output.header['x-hello']).toBe('world');
  });

  it('can clone an existing reponse', async () => {
    let response1 = new Response(null, 'hello world');
    let response2 = new Response(response1, null);
    let output1 = await serve(response1).get('/');
    let output2 = await serve(response2).get('/');
    expect(output1.status).toBe(200);
    expect(output2.status).toBe(500);
    expect(output1.text).toBe(output2.text);
  });
});
