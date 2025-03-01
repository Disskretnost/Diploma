const ApiError = require("./../exceptions/apiError");
const tokenService = require("./../services/token-service");


module.exports = function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return next(ApiError.UnauthorizedError());  // Используйте UnauthorizedError
        }
    
        const accessToken = authorizationHeader.split(' ')[1];
    
        if (!accessToken) {
            return next(ApiError.UnauthorizedError());  // Используйте UnauthorizedError
        }

        const userData = tokenService.validateAccessToken(accessToken);
        if (!userData) {
            return next(ApiError.UnauthorizedError());  // Используйте UnauthorizedError
        }

        req.user = userData;
        next();
    } catch (err) {
        return next(ApiError.UnauthorizedError());  // Используйте UnauthorizedError
    }
}

