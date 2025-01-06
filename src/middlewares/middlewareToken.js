import jwt from 'jsonwebtoken'

const middlewareToken = {
    verifyToken:  (req, res, next) => {
        const token = req.headers.token
        if(token){
            const access_token = token.split(" ")[1]
            jwt.verify(access_token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, user) => {
                if(err){
                    return res.status(403).json({message: 'Invalid token'})
                }
                req.user = user
                next()
            })
        }
        else{
            return res.status(401).json({message: 'Access denied'})
        }
    },
    verifyTokenAndAdminAuth: (req, res, next) => {
        middlewareToken.verifyToken(req, res, () => {
            if (req.user.id === req.params.id || req.user.admin) {
                next()
            } else {
                return res.status(403).json({message: 'You are not allowed to delete other'})
            }
    })
    },
    verifyTokenAndAdmin: (req,res,next)=>{
        verifyToken(req,res, () => {
            if(req.User.admin){
                next()
            }
            else {
                return res.status(403).json({message: 'You are not allowed to access this resource'})
            }
        })
    }
}

export { middlewareToken}