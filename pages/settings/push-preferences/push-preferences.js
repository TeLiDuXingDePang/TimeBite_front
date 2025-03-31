// 推送偏好设置页面
Page({
    data: {
        // 总开关
        mainSwitch: true,

        // 各种推送通知的开关状态
        notifications: {
            // 食材相关
            expiryReminder: true, // 临期食材提醒
            lowStock: true,       // 库存不足提醒
            recipeRecommend: true, // 食谱推荐

            // 计划相关
            mealReminder: true,    // 每日餐食提醒
            shoppingList: true,    // 购物清单提醒

            // 营养相关
            nutritionReport: true, // 营养素摄入报告
            nutritionGoal: true,   // 营养目标提醒

            // 系统消息
            systemUpdate: true,    // 系统更新
            promotions: false      // 活动与优惠（默认关闭）
        },

        // 免打扰时间
        quietTimeStart: '22:00', // 默认晚上10点开始
        quietTimeEnd: '08:00',   // 默认早上8点结束

        // 标记设置是否有变更
        hasChanges: false
    },

    onLoad: function () {
        // 加载用户保存的推送偏好设置
        this.loadPushPreferences();
    },

    // 加载保存的推送偏好设置
    loadPushPreferences: function () {
        try {
            const settings = wx.getStorageSync('pushPreferences');
            if (settings) {
                this.setData({
                    mainSwitch: settings.mainSwitch,
                    notifications: settings.notifications,
                    quietTimeStart: settings.quietTimeStart,
                    quietTimeEnd: settings.quietTimeEnd
                });
            }
        } catch (e) {
            // 加载失败时使用默认设置
            console.error('加载推送偏好设置失败:', e);
        }
    },

    // 切换总开关
    toggleMainSwitch: function (e) {
        const isOn = e.detail.value;
        this.setData({
            mainSwitch: isOn,
            hasChanges: true
        });

        // 如果总开关关闭，可以考虑弹出确认提示
        if (!isOn) {
            wx.showModal({
                title: '关闭所有推送',
                content: '关闭后您将不会收到任何通知，包括重要的食材过期提醒。确定要关闭吗？',
                cancelText: '取消',
                confirmText: '确定关闭',
                success: (res) => {
                    if (res.cancel) {
                        // 用户取消了关闭操作，恢复开关状态
                        this.setData({
                            mainSwitch: true,
                            hasChanges: false
                        });
                    }
                }
            });
        }
    },

    // 切换单个通知开关
    toggleNotification: function (e) {
        const type = e.currentTarget.dataset.type;
        const isOn = e.detail.value;

        let newNotifications = { ...this.data.notifications };
        newNotifications[type] = isOn;

        this.setData({
            notifications: newNotifications,
            hasChanges: true
        });
    },

    // 设置免打扰开始时间
    onQuietTimeStartChange: function (e) {
        this.setData({
            quietTimeStart: e.detail.value,
            hasChanges: true
        });
    },

    // 设置免打扰结束时间
    onQuietTimeEndChange: function (e) {
        this.setData({
            quietTimeEnd: e.detail.value,
            hasChanges: true
        });
    },

    // 保存设置
    saveSettings: function () {
        // 收集所有设置
        const settings = {
            mainSwitch: this.data.mainSwitch,
            notifications: this.data.notifications,
            quietTimeStart: this.data.quietTimeStart,
            quietTimeEnd: this.data.quietTimeEnd
        };

        // 保存到本地存储
        try {
            wx.setStorageSync('pushPreferences', settings);

            // 显示保存成功提示
            wx.showToast({
                title: '设置已保存',
                icon: 'success',
                duration: 2000
            });

            // 重置变更标记
            this.setData({
                hasChanges: false
            });

            // 延迟返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);

        } catch (e) {
            // 保存失败时提示用户
            wx.showToast({
                title: '保存失败，请重试',
                icon: 'none',
                duration: 2000
            });
            console.error('保存推送偏好设置失败:', e);
        }
    },

    // 恢复默认设置
    resetToDefault: function () {
        wx.showModal({
            title: '恢复默认设置',
            content: '确定要将所有推送设置恢复为默认值吗？',
            cancelText: '取消',
            confirmText: '确定',
            success: (res) => {
                if (res.confirm) {
                    // 恢复默认设置
                    this.setData({
                        mainSwitch: true,
                        notifications: {
                            expiryReminder: true,
                            lowStock: true,
                            recipeRecommend: true,
                            mealReminder: true,
                            shoppingList: true,
                            nutritionReport: true,
                            nutritionGoal: true,
                            systemUpdate: true,
                            promotions: false
                        },
                        quietTimeStart: '22:00',
                        quietTimeEnd: '08:00',
                        hasChanges: true
                    });

                    wx.showToast({
                        title: '已恢复默认设置',
                        icon: 'success',
                        duration: 1500
                    });
                }
            }
        });
    },

    // 处理页面返回
    onUnload: function () {
        // 如果有未保存的更改，提示用户
        if (this.data.hasChanges) {
            wx.showModal({
                title: '未保存的更改',
                content: '您有未保存的设置更改，确定要离开吗？',
                cancelText: '取消',
                confirmText: '确定离开',
                success: (res) => {
                    if (res.cancel) {
                        // 用户取消了离开操作
                        // 注意：这里无法阻止页面卸载，只能作为提示
                    }
                }
            });
        }
    }
}) 