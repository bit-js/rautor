import { isEmail } from '../src/validators';
import { emails } from '../datasets/emails';
import { expect, test } from 'bun:test';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

test('Email assertion', () => {
  for (const email of emails)
    expect(isEmail(email) ? email : null).toBe(emailRegex.test(email) ? email : null);
});
