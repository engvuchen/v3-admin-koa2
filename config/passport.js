const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const keys = require('../config/key');

// 解析 token（仅 passport.authenticate 触发），返回在数据库找到的用户信息
// token 过期或缺少，业务处理
module.exports = passport => {
    passport.use(
        new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从客户端请求 header 获得 jsonwebtoken
                secretOrKey: keys.secretOrKey, // 加载 jsonWebKey 的 token 加密用的key
            },
            async function (jwtPayload, done) {
                // 用户身份一定需要在表中存在
                const User = require('../models').user;
                const user = await User.findById(jwtPayload.id); // 如果 user 存在，把 user 设置到 ctx.state.user 中
                if (user) return done(null, user);

                return done(null, false);
            }
        )
    );
};
