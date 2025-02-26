const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10; // You can adjust this value as needed
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log(hashedPassword);
  return hashedPassword;
}

hashPassword('n3admin123!');