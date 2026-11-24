import jwt from 'jsonwebtoken';

export const tokenFor = user => jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
export const clean = doc => { const item = doc.toObject ? doc.toObject() : doc; delete item.password; return item; };
