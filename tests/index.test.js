const parseConfigure = require('../src/lowlevel/protobuf/parse_protocol').parseConfigure
const buildOne = require('../src/lowlevel/send').buildOne;
const receiveOne = require('../src/lowlevel/receive').receiveOne;
const messages = require('./__fixtures__/messages.json');
const fixtures = require('./__fixtures__/messages');

const parsedMessages = parseConfigure(JSON.stringify(messages));

fixtures
// .filter(f => f.name === 'GetAddress')
.forEach(f => {
    describe('encoding json -> protobuf', () => {
        test(`message ${f.name} ${JSON.stringify(f.params)}`, () => {
            expect(() => {
                buildOne(parsedMessages, f.name, f.params)
            }).not.toThrow();

            const encodedMessage = buildOne(parsedMessages, f.name, f.params)
            expect(encodedMessage.toString('hex')).toMatchSnapshot();

            const decodedMessage = receiveOne(parsedMessages, encodedMessage);
            // expect(decodedMessage.type).toEqual(f.name);
            // expect(decodedMessage.message).toEqual(f.params);
            // console.log(decodedMessage);
        });
    })
})
