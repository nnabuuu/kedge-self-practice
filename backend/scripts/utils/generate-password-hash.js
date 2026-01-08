const crypto = require('crypto');

function hashPassword(password, salt) {
  const iterations = 1000;
  const keyLength = 64;
  const digest = 'sha512';
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
  return hash.toString('hex'); // Auth service doesn't use pbkdf2$ prefix
}

const password = '11223344';
const salt = 'demosalt123456';

const passwordHash = hashPassword(password, salt);

console.log('Password:', password);
console.log('Salt:', salt);
console.log('Hash:', passwordHash);