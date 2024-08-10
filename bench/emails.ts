import { group, run, bench } from 'mitata';
import isEmail from '../src/jtd/validators/email';
import { emails } from '../datasets/emails';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const emailRegexValidator = emailRegex.test.bind(emailRegex);

group('Email validation', () => {
  bench('Non-regex', () => emails.map(isEmail));
  bench('Bounded regex', () => emails.map(emailRegexValidator));
});

run();
