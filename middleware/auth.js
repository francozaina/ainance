const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protegerRuta = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ mensaje: 'No autorizado, token requerido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ mensaje: 'Usuario no encontrado' });
        }
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

module.exports = { protegerRuta };
