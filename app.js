// app.js
const api = require('./utils/api');

App({
    globalData: {
        userInfo: null,
        isLoggedIn: false,
        userId: null
    },

    onLaunch() {
        // 检查用户登录状态
        this.checkLoginStatus();

        // 根据登录状态决定跳转
        if (this.globalData.isLoggedIn) {
            // 如果已登录，切换到首页
            wx.switchTab({
                url: '/pages/index/index'
            });
        }
        // 如果未登录，保持在登录页面（登录页是第一个注册的页面）
    },

    // 检查登录状态
    checkLoginStatus() {
        try {
            // 获取存储的token信息
            const token = wx.getStorageSync('token');
            const tokenExpireTime = wx.getStorageSync('tokenExpireTime');
            const userInfo = wx.getStorageSync('userInfo');
            const userId = wx.getStorageSync('userId');

            // 检查token是否存在且未过期
            if (token && tokenExpireTime > new Date().getTime() && userInfo && userInfo.nickname) {
                this.globalData.userInfo = userInfo;
                this.globalData.isLoggedIn = true;
                this.globalData.userId = userId;
            } else {
                this.globalData.isLoggedIn = false;
                this.globalData.userId = null;

                // 清除过期的登录信息
                if (tokenExpireTime && tokenExpireTime <= new Date().getTime()) {
                    wx.removeStorageSync('token');
                    wx.removeStorageSync('tokenExpireTime');
                    wx.removeStorageSync('userId');
                    wx.removeStorageSync('userInfo');
                }
            }
        } catch (e) {
            console.error('获取登录状态失败', e);
            this.globalData.isLoggedIn = false;
            this.globalData.userId = null;
        }
    },

    // 获取用户信息
    getUserInfo() {
        return this.globalData.userInfo;
    },

    // 更新用户登录状态
    updateLoginStatus(loginResult) {
        console.log('----------更新登录状态调试开始----------');
        console.log('A1. 更新登录状态，原始数据:', loginResult);
        console.log('A1.1 原始数据类型:', typeof loginResult);

        // 处理字符串响应（如果响应是JSON字符串，则解析它）
        let responseData = loginResult;
        if (typeof loginResult === 'string') {
            try {
                console.log('A1.2 响应是字符串，尝试解析JSON');

                // 修复NaN在JSON中的问题：先替换掉NaN为"NaN"字符串，然后再解析
                const cleanedJson = loginResult.replace(/:\s*NaN\s*([,}])/g, ':"NaN"$1');
                console.log('A1.2.1 清理后的JSON字符串:', cleanedJson);

                responseData = JSON.parse(cleanedJson);
                console.log('A1.3 解析后的数据:', responseData);

                // 将所有"NaN"字符串转回为null
                const convertNaNStrings = (obj) => {
                    if (!obj || typeof obj !== 'object') return;

                    Object.keys(obj).forEach(key => {
                        if (obj[key] === "NaN") {
                            obj[key] = null;
                            console.log(`A1.3.1 将字段 ${key} 的值从"NaN"转为null`);
                        } else if (typeof obj[key] === 'object') {
                            convertNaNStrings(obj[key]);
                        }
                    });
                };

                convertNaNStrings(responseData);
                console.log('A1.3.2 处理NaN后的数据:', responseData);

            } catch (parseError) {
                console.error('A1.4 JSON解析失败:', parseError);
                // 如果解析失败，保持原始值
            }
        } else if (responseData && typeof responseData === 'object') {
            // 即使是对象，也可能内部有NaN值需要转换为null
            const cleanNaNValues = (obj) => {
                if (!obj || typeof obj !== 'object') return;

                Object.keys(obj).forEach(key => {
                    if (obj[key] === "NaN" || (typeof obj[key] === 'number' && isNaN(obj[key]))) {
                        obj[key] = null;
                        console.log(`A1.4.1 将对象中字段 ${key} 的NaN值转为null`);
                    } else if (typeof obj[key] === 'object') {
                        cleanNaNValues(obj[key]);
                    }
                });
            };

            cleanNaNValues(responseData);
            console.log('A1.4.2 清理对象中NaN后的数据:', responseData);
        }

        console.log('A1.5 处理后的响应数据类型:', typeof responseData);

        // 检查loginResult是否存在
        if (!responseData) {
            console.error('A2.1 登录结果对象为null或undefined');
            console.log('----------更新登录状态调试结束----------');
            return false;
        }

        // 检查loginResult.data是否存在
        if (!responseData.data) {
            console.error('A2.2 登录结果中无data字段');
            console.log('----------更新登录状态调试结束----------');
            return false;
        }

        try {
            console.log('A3. 开始提取登录结果数据');
            const { token, userInfo, userId, expiresIn } = responseData.data;

            // 检查必要的字段是否存在
            if (!token || !userId) {
                console.error('A3.1 登录结果中缺少必要的字段 token或userId');
                console.log('A3.2 token值:', token);
                console.log('A3.3 userId值:', userId);
                console.log('----------更新登录状态调试结束----------');
                return false;
            }

            // 输出日志便于调试
            console.log('A4. 登录数据摘要:', {
                userId: userId,
                token: token ? '已获取' : '未获取',
                tokenLength: token ? token.length : 0,
                expiresIn: expiresIn,
                userInfo: userInfo ? '已获取' : '未获取'
            });

            const loginTime = new Date().getTime();
            console.log('A5. 当前登录时间戳:', loginTime);

            // 确保userInfo字段存在
            if (!userInfo) {
                console.error('A6.1 用户信息对象为空');
                console.log('----------更新登录状态调试结束----------');
                return false;
            }

            // 处理用户信息中的异常值
            console.log('A6.2 开始处理用户信息对象:', userInfo);

            // 确保头像URL是完整的
            if (userInfo.avatarUrl) {
                console.log('A7. 原始头像URL:', userInfo.avatarUrl);
                userInfo.avatarUrl = api.getFullImageUrl(userInfo.avatarUrl);
                console.log('A8. 处理后的头像URL:', userInfo.avatarUrl);
            }

            // 处理healthGoal字段
            if (userInfo.healthGoal === null ||
                userInfo.healthGoal === undefined ||
                userInfo.healthGoal === "NaN" ||
                (typeof userInfo.healthGoal === 'number' && isNaN(userInfo.healthGoal)) ||
                userInfo.healthGoal === "") {
                console.log('A9. 健康目标为空或NaN，设置默认值');
                userInfo.healthGoal = '减脂模式 | 每日<1500kcal';
            }

            // 处理会员等级
            if (!userInfo.memberLevel) {
                console.log('A12. 会员等级为空，设置默认值');
                userInfo.memberLevel = '普通用户';
            }

            console.log('A13. 处理后的完整用户信息:', userInfo);

            // 保存到本地存储
            console.log('A15. 开始保存数据到本地存储');
            try {
                wx.setStorageSync('userInfo', userInfo);
                console.log('A16. 保存userInfo成功');
                wx.setStorageSync('token', token);
                console.log('A17. 保存token成功');
                wx.setStorageSync('tokenExpireTime', loginTime + expiresIn * 1000);
                console.log('A18. 保存tokenExpireTime成功, 过期时间:', new Date(loginTime + expiresIn * 1000).toLocaleString());
                wx.setStorageSync('userId', userId);
                console.log('A19. 保存userId成功');
            } catch (storageErr) {
                console.error('A20. 保存到本地存储失败:', storageErr);
                throw storageErr; // 重新抛出以便外层捕获
            }

            // 更新全局状态
            console.log('A21. 开始更新全局状态');
            this.globalData.userInfo = userInfo;
            this.globalData.isLoggedIn = true;
            this.globalData.userId = userId;

            console.log('A22. 登录状态更新成功');
            console.log('----------更新登录状态调试结束----------');
            return true;
        } catch (e) {
            console.error('A23. 更新登录状态失败, 错误详情:', e);
            console.error('A24. 错误堆栈:', e.stack);
            console.log('----------更新登录状态调试结束----------');
            return false;
        }
    }
})
