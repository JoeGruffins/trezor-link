const messages = require('./messages.json');

const findInEnums = (type, enums) => {
    if (!enums) return;
    return enums.find(en => {
        return en.name === type;
    });
}

const findEnumType = (type, message, messages) => {
    if (findInEnums(type, message.enums) || findInEnums(type, messages.enums)) {
        return 1;
    }
}

const findKeyValueRecursive = (data, key, value) => {
    let result = {};
    const traverse = (data, key, value) => {
        for (let k in data) {
            if (typeof data[k] !== "object" || data[k] === null) {
                continue;
            }
            if (data[k][key] === value) {
                result = data[k];
                return;
            }
            traverse(data[k], key, value);
        }
    }
    traverse(data, key, value);
    return result;
}

const findComplexType = (type, messages) => {
    return findKeyValueRecursive(messages, 'name', type)
}

const getValueForField = (field) => {
    let value;
    if (field.options && field.options.default) {
        return field.options.default;
    }
    switch (field.type) {
        case 'bool':
            value = true;
            break;
        case 'string':
            value = 'some string';
            break;
        case 'uint32':
            value = 32;
            break;
        case 'uint64': 
            value = 64;
            break;
        case 'sint32':
            value = -32;
            break;
        case 'sint64':
            value = -64;
            break;
        case 'bytes':
            value = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]); 
            break;
    }
    return value;

}
const buildParams = (message) => {
    const params = {};
    // then it is nested enum
    if (message.values) {
        return 1;
    }
    message.fields.forEach(field => {
        let value = getValueForField(field); 
        if (!value) {
            const complex = findComplexType(field.type, messages);
            if (complex) {
                value = buildParams(complex)
            }
            const en = findEnumType(field.type, message, messages);
            if (en) {
                value = en;
            }
        }
        if (value) {
            if (field.rule === 'repeated') {
                return params[field.name] = [ value ];
            }
            return params[field.name] = value ;
        }
        
        console.log('unhandled field type ', field.type);
    })
    return params;
}

const buildFixtures = (messages) => {
    const fixtures = [];

    
    // I only want to test messages that are really parsed by trezor-link, which are messages listed under
    // messages.json.enums[1] (name="MessageType").
    const messageTypeEnum = messages.enums.find(en => en.name === 'MessageType').values;
    const messageNames = messageTypeEnum.map(m => {
        return m.name.substr(m.name.lastIndexOf('_')+ 1);
    })

    messages.messages
        .filter(m => messageNames.includes(m.name))
        .forEach(message => {
        // not really sure what it is. skip it but research later
            if (message.ref === 'google.protobuf.EnumValueOptions') {
                return;
            }
            let fixture = {
                name: message.name,
                description: message.name,
                params: {}
            }

            if (!message.fields) {
                return fixtures.push(fixture);
            }
            try {
                const params = buildParams(message)
            
                fixtures.push({
                    name: message.name,
                    params,
                })

            } catch (err) {
                console.log(err);
                process.exit(1);
                return
            }
    });

    return fixtures;
}

const fixtures = buildFixtures(messages);

module.exports = fixtures;