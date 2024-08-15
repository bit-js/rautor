import { dynamicError, staticError } from '../../src/error';
import { App } from '../../src/app';

const randomError = staticError();
const msgError = dynamicError<string>();

const fetch = new App()
  .use(() => {
    if (Math.random() < 0.3) return randomError;
    if (Math.random() < 0.6) return msgError.create('File not found');
  })
  .get('/', () => 'Hi')
  .catch(randomError, (c) => {
    c.status = 500;
    return 'An error occured'
  })
  .catch(msgError, (msg, c) => {
    c.status = 404;
    return msg;
  })
  .compile();

console.log(fetch.toString());
