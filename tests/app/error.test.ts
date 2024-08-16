import { dynamicError, staticError } from '../../src/error';
import { App } from '../../src/app';

const randomError = staticError();
const msgError = dynamicError<string>();

const fetch = new App()
  // Throw error randomly for testing
  .use(() => {
    if (Math.random() < 0.3) return randomError;
    if (Math.random() < 0.6) return msgError.create('File not found');
  })

  // An example route
  .get('/', () => 'Hi')

  // Handle static error
  .catch(randomError, (c) => {
    c.status = 500;
    return 'An error occured';
  })

  // Handle dynamic error
  .catch(msgError, (msg, c) => {
    c.status = 404;
    return msg;
  })

  // Compile to a fetch function
  .compile();

console.log(fetch.toString());
