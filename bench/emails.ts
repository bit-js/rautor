import { group, run, bench } from 'mitata';
import { isEmail } from '../src/validators';
import { emails } from '../datasets/emails';

for (let i = 0; i < 10; i++) bench('noop', () => { });

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const emailRegexValidator = emailRegex.test.bind(emailRegex);

group('Email validation', () => {
  bench('Non-regex', () => emails.map(isEmail));
  bench('Bounded regex', () => emails.map(emailRegexValidator));
  bench('Regex', () => emails.map((email) => emailRegex.test(email)));
});

run();
