import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { role: 'driver', aud: 'driver' },
  process.env.JWT_SECRET || 'your-secret',
  {
    subject: 'GD-003',   // exact Driver_ID from DB
    expiresIn: '1h',    
  }
);

console.log(token);