// about.js
Page({
    data: {
        // 基础数据
    },

    onLoad: function () {
        // 页面加载
    },

    onShareAppMessage: function () {
        return {
            title: '食光机 - 您的智能食材管理与营养分析助手',
            path: '/pages/index/index'
        };
    },

    // 复制邮箱
    copyEmail: function () {
        wx.setClipboardData({
            data: '3159268198@qq.com',
            success: function () {
                wx.showToast({
                    title: '邮箱已复制',
                    icon: 'success',
                    duration: 2000
                });
            }
        });
    },

    // 复制微信公众号
    copyWechat: function () {
        wx.setClipboardData({
            data: '食光机营养',
            success: function () {
                wx.showToast({
                    title: '公众号已复制',
                    icon: 'success',
                    duration: 2000
                });
            }
        });
    },

    // 打开网站
    openWebsite: function () {
        // 由于小程序限制，无法直接打开外部链接
        // 这里复制网址到剪贴板
        wx.setClipboardData({
            data: 'www.shiguangji.com',
            success: function () {
                wx.showToast({
                    title: '网址已复制',
                    icon: 'success',
                    duration: 2000
                });
            }
        });
    }
}); 