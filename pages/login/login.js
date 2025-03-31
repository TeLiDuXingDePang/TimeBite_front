// pages/login/login.js
// 导入工具类
const api = require('../../utils/api');

// 默认头像URL - 使用固定URL
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        avatarUrl: '',
        nickname: '',
        hasCustomAvatar: false,
        canLogin: false,
        isFocused: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 检查全局登录状态
        const app = getApp();
        app.checkLoginStatus();

        // 如果已经登录，直接跳转到首页
        if (app.globalData.isLoggedIn) {
            wx.switchTab({
                url: '/pages/index/index'
            });
            return;
        }

        // 检查是否有缓存的用户信息
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({
                avatarUrl: userInfo.avatarUrl || defaultAvatarUrl,
                nickname: userInfo.nickname || '',
                hasCustomAvatar: !!userInfo.avatarUrl && userInfo.avatarUrl !== defaultAvatarUrl,
                canLogin: !!userInfo.nickname
            });
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    },

    // 处理头像选择
    onChooseAvatar(e) {
        const { avatarUrl } = e.detail;
        this.setData({
            avatarUrl,
            hasCustomAvatar: true
        });
        this.checkCanLogin();
    },

    // 处理昵称输入
    onInputNickname(e) {
        const nickname = e.detail.value;
        this.setData({
            nickname
        });
        this.checkCanLogin();
    },

    // 输入框聚焦
    onInputFocus() {
        this.setData({
            isFocused: true
        });
    },

    // 输入框失去焦点
    onInputBlur() {
        this.setData({
            isFocused: false
        });
    },

    // 检查是否可以登录
    checkCanLogin() {
        const { nickname, hasCustomAvatar } = this.data;
        const canLogin = nickname.trim().length > 0 && hasCustomAvatar;

        this.setData({
            canLogin
        });
    },

    // 处理登录逻辑
    handleLogin() {
        const { nickname, avatarUrl, canLogin } = this.data;

        if (!canLogin) {
            return;
        }

        // 显示加载提示
        wx.showLoading({
            title: '登录中...',
            mask: true
        });

        // 先获取微信登录凭证
        wx.login({
            success: (loginRes) => {
                if (loginRes.code) {
                    // 获取到code后，处理登录请求
                    this.processLogin(loginRes.code, nickname, avatarUrl);
                } else {
                    wx.hideLoading();
                    wx.showToast({
                        title: '微信登录失败，请重试',
                        icon: 'error'
                    });
                    console.error('wx.login 失败:', loginRes.errMsg);
                }
            },
            fail: (err) => {
                wx.hideLoading();
                wx.showToast({
                    title: '微信登录失败，请重试',
                    icon: 'error'
                });
                console.error('wx.login 失败:', err);
            }
        });
    },

    // 处理登录请求
    processLogin(code, nickname, avatarUrl) {
        const loginTime = new Date().getTime();

        // 方式一：将头像转为base64后直接传输
        wx.getFileSystemManager().readFile({
            filePath: avatarUrl,
            encoding: 'base64',
            success: (fileRes) => {
                const base64Avatar = 'data:image/jpeg;base64,' + fileRes.data;

                // 构造请求参数
                const loginData = {
                    code,
                    nickname,
                    avatarUrl: base64Avatar,
                    loginTime
                };

                // 调用登录接口
                api.loginWithBase64(loginData)
                    .then(result => {
                        wx.hideLoading();
                        this.handleLoginResult(result);
                    })
                    .catch(err => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '登录失败，请重试',
                            icon: 'error'
                        });
                        console.error('登录失败:', err);
                    });
            },
            fail: (err) => {
                // 文件读取失败时，尝试使用FormData方式上传
                console.warn('头像读取为base64失败，尝试使用FormData方式上传', err);

                // 构造请求参数
                const loginParams = {
                    code,
                    nickname,
                    avatarUrl,
                    loginTime
                };

                // 调用登录接口（FormData方式）
                api.loginWithFormData(loginParams)
                    .then(result => {
                        wx.hideLoading();
                        this.handleLoginResult(result);
                    })
                    .catch(err => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '登录失败，请重试',
                            icon: 'error'
                        });
                        console.error('登录失败:', err);
                    });
            }
        });
    },

    // 处理登录结果
    handleLoginResult(result) {
        console.log('----------登录响应调试开始----------');
        console.log('1. 原始登录响应数据:', result);
        console.log('2. 响应数据类型:', typeof result);

        // 处理字符串响应（如果响应是JSON字符串，则解析它）
        let responseData = result;
        if (typeof result === 'string') {
            try {
                console.log('2.1 响应是字符串，尝试解析JSON');

                // 修复NaN在JSON中的问题：先替换掉NaN为"NaN"字符串，然后再解析
                const cleanedJson = result.replace(/:\s*NaN\s*([,}])/g, ':"NaN"$1');
                console.log('2.1.1 清理后的JSON字符串:', cleanedJson);

                responseData = JSON.parse(cleanedJson);
                console.log('2.2 解析后的数据:', responseData);

                // 将所有"NaN"字符串转回为null
                const convertNaNStrings = (obj) => {
                    if (!obj || typeof obj !== 'object') return;

                    Object.keys(obj).forEach(key => {
                        if (obj[key] === "NaN") {
                            obj[key] = null;
                            console.log(`2.2.1 将字段 ${key} 的值从"NaN"转为null`);
                        } else if (typeof obj[key] === 'object') {
                            convertNaNStrings(obj[key]);
                        }
                    });
                };

                convertNaNStrings(responseData);
                console.log('2.2.2 处理NaN后的数据:', responseData);

            } catch (parseError) {
                console.error('2.3 JSON解析失败:', parseError);
                console.error('2.3.1 原始字符串:', result);

                // 如果常规解析失败，尝试更强力的方法处理
                try {
                    console.log('2.4 尝试手动提取JSON结构');
                    // 使用正则表达式尝试提取JSON对象的结构
                    const jsonRegex = /\{\s*"code"\s*:\s*(\d+)\s*,\s*"data"\s*:\s*\{.*?\}\s*,\s*"message"\s*:\s*"(.+?)"\s*\}/s;
                    const match = result.match(jsonRegex);

                    if (match) {
                        // 提取关键部分
                        const code = parseInt(match[1]);
                        const message = match[2];

                        // 创建一个基本的响应对象
                        responseData = {
                            code: code,
                            message: message,
                            data: {
                                userInfo: {}
                            }
                        };

                        console.log('2.5 手动构建的响应数据:', responseData);
                    } else {
                        console.error('2.6 无法手动提取JSON结构');
                    }
                } catch (manualError) {
                    console.error('2.7 手动提取失败:', manualError);
                    // 保持原始值
                }
            }
        }

        console.log('3. 处理后的响应数据类型:', typeof responseData);
        console.log('3.1 响应code值:', responseData ? responseData.code : 'undefined');

        // 强制测试条件判断
        console.log('特殊测试 - 各种条件判断结果:');
        console.log('responseData 是否为真:', !!responseData);
        console.log('responseData.code 是否等于 0:', responseData && responseData.code === 0);
        console.log('responseData.code 的实际值和类型:', responseData ? responseData.code : 'undefined', typeof (responseData ? responseData.code : 'undefined'));
        console.log('responseData && responseData.code === 0 的完整结果:', !!(responseData && responseData.code === 0));

        console.log('4. 条件判断 responseData && responseData.code === 0 结果:', !!(responseData && responseData.code === 0));

        try {
            // 检查responseData是否存在
            if (!responseData) {
                console.error('18. 响应结果为空');
                wx.showToast({
                    title: '登录失败，响应为空',
                    icon: 'error'
                });
                console.log('----------登录响应调试结束----------');
                return;
            }

            // 检查code字段
            const code = Number(responseData.code);
            console.log('19. 响应code转为数字后:', code, '类型:', typeof code);

            // 明确检查code === 0
            if (code === 0) {
                console.log('5. 进入成功处理分支');

                // 处理用户信息
                if (responseData.data && responseData.data.userInfo) {
                    console.log('6. 用户信息存在:', responseData.data.userInfo);

                    // 处理头像URL
                    if (responseData.data.userInfo.avatarUrl) {
                        const fullAvatarUrl = api.getFullImageUrl(responseData.data.userInfo.avatarUrl);
                        responseData.data.userInfo.avatarUrl = fullAvatarUrl;
                        console.log('7. 处理后的头像URL:', fullAvatarUrl);
                    }

                    // 处理healthGoal
                    if (responseData.data.userInfo.healthGoal === null ||
                        responseData.data.userInfo.healthGoal === undefined ||
                        isNaN(responseData.data.userInfo.healthGoal) ||
                        responseData.data.userInfo.healthGoal === "NaN" ||
                        responseData.data.userInfo.healthGoal === "") {
                        responseData.data.userInfo.healthGoal = '减脂模式 | 每日<1500kcal';
                        console.log('8. 设置默认健康目标:', responseData.data.userInfo.healthGoal);
                    }
                }

                console.log('9. 准备更新全局登录状态');
                // 登录成功，更新全局登录状态
                const app = getApp();
                const isSuccess = app.updateLoginStatus(responseData);
                console.log('10. 更新登录状态结果:', isSuccess);

                if (isSuccess) {
                    console.log('11. 登录成功，准备跳转到首页');
                    // 首先隐藏loading
                    wx.hideLoading();

                    // 显示登录成功提示
                    const nickname = responseData.data.userInfo.nickname;
                    wx.showToast({
                        title: `欢迎您，${nickname}`,
                        icon: 'success',
                        duration: 1500
                    });

                    // 延迟一会再跳转，让用户看到成功提示
                    setTimeout(() => {
                        console.log('11.1 准备跳转到首页...');
                        wx.switchTab({
                            url: '/pages/index/index',
                            success: () => {
                                console.log('12. 成功跳转到首页');
                            },
                            fail: (err) => {
                                console.error('13. 跳转到首页失败:', err);
                                // 如果跳转失败，尝试使用重定向
                                console.log('13.1 尝试使用redirectTo跳转');
                                wx.redirectTo({
                                    url: '/pages/index/index',
                                    fail: (redirectErr) => {
                                        console.error('13.2 重定向也失败:', redirectErr);
                                        // 如果都失败了，至少通知用户登录已成功
                                        wx.showModal({
                                            title: '登录成功',
                                            content: '登录成功，但跳转到首页失败，请手动返回。',
                                            showCancel: false
                                        });
                                    }
                                });
                            }
                        });
                    }, 1500); // 延迟1.5秒
                } else {
                    console.error('14. 登录状态更新失败');
                    wx.showToast({
                        title: '登录状态更新失败',
                        icon: 'error'
                    });
                }
            } else {
                console.error('15. 响应code不为0:', code);
                // 登录失败
                wx.showToast({
                    title: responseData.message || '登录失败，请重试',
                    icon: 'error'
                });
                console.error('16. 登录失败:', responseData);
            }
        } catch (err) {
            console.error('17. 处理登录结果时发生异常:', err);
            console.error('17.1 异常堆栈:', err.stack);
            wx.showToast({
                title: '登录处理异常，请重试',
                icon: 'error',
                duration: 2000
            });
        }

        console.log('----------登录响应调试结束----------');
    },

    // 跳转到隐私政策
    navigateToPrivacyPolicy() {
        wx.navigateTo({
            url: '/pages/legal/privacy-policy/privacy-policy'
        });
    },

    // 跳转到用户协议
    navigateToUserAgreement() {
        wx.navigateTo({
            url: '/pages/legal/user-agreement/user-agreement'
        });
    }
})