
/* global expect */

const request = require('supertest');

const Response = require('../src/response');

let serve = response => request(response.send.bind(response));

describe('basic response', () => {
  it('defaults to 404', async () => {
    let response = new Response();
    let output = await serve(response).get('/');
    expect(output.status).toBe(404);
  });

  it('sends the given content as 200', async () => {
    let response = new Response('hello world');
    let output = await serve(response).get('/');
    expect(output.status).toBe(200);
    expect(output.text).toBe('hello world');
  });
});

describe('response constructor', () => {
  it('sets text content type for strings', async () => {
    let response = new Response('hello world');
    let output = await serve(response).get('/');
    expect(output.type).toBe('text/plain');
  });

  it('sets json content type for objects', async () => {
    let response = new Response({hello:  'world'});
    let output = await serve(response).get('/');
    expect(output.type).toBe('application/json');
  });

  it('allows custom response', async () => {
    let response = new Response((req, res) => {
      res.statusCode = 211;
      res.setHeader('x-hello', 'world');
      res.end();
    });
    let output = await serve(response).get('/');
    expect(output.status).toBe(211);
    expect(output.header['x-hello']).toBe('world');
  });

  it('can clone an existing reponse', async () => {
    let response1 = new Response('hello world');
    let response2 = Object.assign(new Response(response1), {
      status: 500,
    });
    let output1 = await serve(response1).get('/');
    let output2 = await serve(response2).get('/');
    expect(output1.status).toBe(200);
    expect(output2.status).toBe(500);
    expect(output1.text).toBe(output2.text);
  });
});

describe('building from promise', () => {
  it('builds a 200 response from a successful promise', async() => {
    let response = await Response.fromPromise(new Promise(resolve =>
      setTimeout(() => resolve('hello world'), 100)
    ));
    let output = await serve(response).get('/');
    expect(output.status).toBe(200);
    expect(output.text).toBe('hello world');
  });

  it('builds a 500 response from a failed promise', async() => {
    let response = await Response.fromPromise(new Promise(() => {
      throw('error');
    }));
    let output = await serve(response).get('/');
    expect(output.status).toBe(500);
    expect(output.text).toBe('error');
  });

  it('can build errors with other status codes', async () => {
    let response = await Response.fromPromise(new Promise(() => {
      throw(Object.assign(new Response(), {
          status: 401,
      }));
    }));
    let output = await serve(response).get('/');
    expect(output.status).toBe(401);
  });

  it('also accepts non promise input', async () => {
    let response = await Response.fromPromise("not a promise");
    let output = await serve(response).get('/');
    expect(output.status).toBe(200);
    expect(output.text).toBe('not a promise');
  });
})

describe('response object', () => {
  it('allows changing status', async () => {
    let response = new Response();
    response.status = 218;
    let output = await serve(response).get('/');
    expect(output.status).toBe(218);
  });

  it('allows changing content type', async () => {
    let response = new Response({hello: 'world'});
    response.type = 'text';
    let output = await serve(response).get('/');
    expect(output.type).toBe('text/plain');
    expect(output.text).toBe('{"hello":"world"}');
  });

  it('allows changing body', async () => {
    let response = new Response(null, 'hello');
    response.body = 'world';
    let output = await serve(response).get('/');
    expect(output.text).toBe('world');
  });

  it('allows changing headers', async () => {
    let response = new Response();
    response.headers['x-hello'] = 'world';
    let output = await serve(response).get('/');
    expect(output.header['x-hello']).toBe('world');
  });

  it('defaults to 404 when empty', async () => {
    let response = new Response('hello world');
    delete response.error;
    delete response.status;
    delete response.type;
    delete response.body;
    delete response.custom;
    delete response.headers;
    let output = await serve(response).get('/');
    expect(output.status).toBe(404);
  });
});

describe('sending response', () => {
  it('custom has highest priority, and ignores all other fields', async () => {
    let response = new Response();
    response.status = 218;
    response.custom = (req, res) => res.end('hello world');
    let output = await serve(response).get('/');
    expect(output.status).toBe(200);
    expect(output.header['x-powered-by']).toBeUndefined();
    expect(output.text).toBe('hello world');
  });

  it('otherwise, always sets the defined headers', async () => {
    let responses = [
      new Response(),
      new Response('okay'),
    ];
    await Promise.all(responses.map(async response => {
      response.headers['x-hello'] = 'world';
      let output = await serve(response).get('/');
      expect(output.header['x-hello']).toBe('world');
    }));
  });
});
