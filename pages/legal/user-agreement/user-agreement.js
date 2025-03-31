// user-agreement.js
Page({
    data: {
        // 页面数据
    },

    onLoad: function () {
        // 页面加载时执行
    },

    onShareAppMessage: function () {
        // 当用户点击分享时
        return {
            title: '食光机 - 用户协议',
            path: '/pages/legal/user-agreement'
        }
    }
}) 