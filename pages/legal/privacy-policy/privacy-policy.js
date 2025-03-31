// privacy-policy.js
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
            title: '食光机 - 隐私政策',
            path: '/pages/legal/privacy-policy'
        }
    }
}) 