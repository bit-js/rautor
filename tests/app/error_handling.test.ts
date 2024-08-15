import { staticError } from '../../src/error';
import { App } from '../../src/app';

const randomError = staticError();

const fetch = new App()
  .use(() => {
    if (Math.random() < 0.5) return randomError;
  })
  .get('/', () => 'Hi')
  .catch(randomError, (c) => {
    c.status = 500;
    return 'An error occured'
  })
  .compile();

console.log(fetch.toString());
