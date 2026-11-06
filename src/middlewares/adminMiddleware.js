const adminOnly = (req, res, next) => {
    // res.user is set by your authMiddleware, so we can check the user's role here
    if (req.user && req.user.role === 'ADMIN'){
        next(); // User is an admin, proceed to the next middleware or route handler
    } else {
        res.status(403).json({ message: 'Access denied. Admins only.' });
    }
};

module.exports = { adminOnly };