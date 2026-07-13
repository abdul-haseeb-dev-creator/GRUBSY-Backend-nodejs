import jwt from 'jsonwebtoken';
const secret = 'H3/hLvUjwLtIzkA2naBiZg3dgrUs8fAziqeSS8CA1CY';
const payload = {
  sub: 'grubsy_master_1',
  email: 'grubsy.delivery@gmail.com',
  role: 'super_admin',
  aud: 'admin',
  permissions: 'all'
};
const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log(token);
