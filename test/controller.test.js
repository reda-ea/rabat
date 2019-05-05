
const request = require('supertest');
const url = require('url');

const Controller = require('../src/controller');

describe('basic functionality', () => {
    it('builds a simple action', async () => {
        let controller = new Controller();
        let action = controller.build(() => 'hello world');
        let output = await request(action).get('/');
        expect(output.status).toBe(200);
        expect(output.text).toBe('hello world');
    });

    it('provides a simple extension', async () => {
        let controller = new Controller();
        let extension = req => url.parse(req.url, true).query;
        controller.extensions.push(extension);
        let action = controller.build(({name = 'world'}) => `hello ${name}`);
        let output1 = await request(action).get('/');
        expect(output1.status).toBe(200);
        expect(output1.text).toBe('hello world');
        let output2 = await request(action).get('/?name=reda');
        expect(output2.status).toBe(200);
        expect(output2.text).toBe('hello reda');
    });

    it('applies a simple formatter', async () => {
        let controller = new Controller();
        let formatter = response => Object.assign(response, {
            body: `**${response.body}**`,
        });
        controller.formatters.push(formatter);
        let action = controller.build(() => 'hello world');
        let output = await request(action).get('/');
        expect(output.status).toBe(200);
        expect(output.text).toBe('**hello world**');
    })
});
