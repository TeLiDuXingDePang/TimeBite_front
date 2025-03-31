// 路由拦截器
const app = getApp();

// 不需要登录就可以访问的页面
const whiteList = [
    '/pages/login/login',
    '/pages/legal/privacy-policy/privacy-policy',
    '/pages/legal/user-agreement/user-agreement'
];

/**
 * 检查页面是否需要登录验证
 * @param {String} url 页面路径
 * @returns {Boolean} 是否需要验证
 */
function needAuth(url) {
    if (!url) return true;

    return !whiteList.some(item => url.startsWith(item));
}

/**
 * 检查是否已登录，未登录则自动跳转到登录页
 * @param {Object} options 路由参数
 * @returns {Boolean} 是否通过验证
 */
function checkLogin(options = {}) {
    const { redirect = true, delta = 1 } = options;

    // 先刷新一下登录状态
    app.checkLoginStatus();

    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
        if (redirect) {
            wx.redirectTo({
                url: '/pages/login/login'
            });
        }
        return false;
    }

    return true;
}

/**
 * 跳转到页面，自动进行登录验证
 * @param {String} url 页面路径
 * @param {Boolean} needCheck 是否需要登录验证
 */
function navigateTo(url, needCheck = true) {
    if (!url) return;

    if (needCheck && needAuth(url) && !checkLogin({ redirect: true })) {
        return;
    }

    wx.navigateTo({
        url
    });
}

/**
 * 重定向到页面，自动进行登录验证
 * @param {String} url 页面路径
 * @param {Boolean} needCheck 是否需要登录验证
 */
function redirectTo(url, needCheck = true) {
    if (!url) return;

    if (needCheck && needAuth(url) && !checkLogin({ redirect: true })) {
        return;
    }

    wx.redirectTo({
        url
    });
}

/**
 * 切换到 tabBar 页面，自动进行登录验证
 * @param {String} url 页面路径
 * @param {Boolean} needCheck 是否需要登录验证
 */
function switchTab(url, needCheck = true) {
    if (!url) return;

    if (needCheck && needAuth(url) && !checkLogin({ redirect: true })) {
        return;
    }

    wx.switchTab({
        url
    });
}

module.exports = {
    navigateTo,
    redirectTo,
    switchTab,
    checkLogin,
    needAuth
}; 