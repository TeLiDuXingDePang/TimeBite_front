// profile.js
const api = require('../../utils/api');

Page({
    data: {
        userInfo: {
            avatarUrl: '/assets/images/default-avatar.png',
            nickName: '用户昵称',
            healthGoal: '减脂模式 | 每日<1500kcal'
        },
        memberInfo: {
            level: '铂金会员',
            consultRemaining: '无限次',
            points: 1280
        },
        expiryReminderTime: 48, // 小时
        // 优化提醒选项数据结构，用于模板渲染
        reminderOptions: [
            { days: 1, hours: 24, desc: '临期前一天提醒' },
            { days: 2, hours: 48, desc: '临期前两天提醒' },
            { days: 3, hours: 72, desc: '临期前三天提醒' },
        ],
        showExpiryPickerModal: false, // 控制保质期提醒选择器弹窗
        calorieTarget: 1500, // 默认热量目标

        // 用户信息编辑相关数据
        showEditUserInfoModal: false, // 控制用户信息编辑弹窗
        editUserInfo: {
            avatarUrl: '',
            nickname: '',
            healthGoal: ''
        },
        healthGoalOptions: [
            '减脂模式 | 每日<1500kcal',
            '健身增肌 | 每日>2000kcal',
            '均衡饮食 | 每日1800kcal',
            '低碳水饮食 | 控制碳水<100g',
            '高蛋白饮食 | 蛋白质>100g'
        ],
        healthGoalIndex: 0,
        canSave: false // 控制保存按钮是否可点击
    },

    onLoad: function () {
        // 页面加载时获取用户信息
        this.getUserInfo();
        // 获取会员信息
        this.getMemberInfo();
        // 获取用户热量目标
        this.getCalorieTarget();
        // 获取保质期提醒时间设置
        this.getExpiryReminderTime();
    },

    // 在页面显示时重新获取用户信息，确保数据最新
    onShow: function () {
        this.getUserInfo();
    },

    // 获取保质期提醒时间设置
    getExpiryReminderTime: function () {
        const reminderTime = wx.getStorageSync('expiryReminderTime') || 48;
        this.setData({
            expiryReminderTime: reminderTime
        });
    },

    getUserInfo: function () {
        // 从全局应用实例获取用户信息
        const app = getApp();
        let userInfo = app.globalData.userInfo;

        console.log('Profile页面获取用户信息:', userInfo);

        // 如果全局状态没有，尝试从本地存储获取
        if (!userInfo) {
            userInfo = wx.getStorageSync('userInfo');
            console.log('从本地存储获取用户信息:', userInfo);
        }

        // 如果有用户信息，更新页面数据
        if (userInfo) {
            console.log('获取到的原始用户信息:', JSON.stringify(userInfo));

            // 处理头像URL，确保是完整路径
            const avatarUrl = api.getFullImageUrl(userInfo.avatarUrl);

            // 处理健康目标 - 只有真正为空或NaN时才使用默认值
            let healthGoal = userInfo.healthGoal;

            // 移除错误的判断条件，只保留真正异常的情况
            if (healthGoal === null ||
                healthGoal === undefined ||
                healthGoal === "") {
                console.log('个人资料页面 - 健康目标为空，使用默认值');
                healthGoal = '减脂模式 | 每日<1500kcal';
            } else {
                console.log('获取到有效的健康目标:', healthGoal);
            }

            this.setData({
                userInfo: {
                    avatarUrl: avatarUrl || '/assets/images/default-avatar.png',
                    nickName: userInfo.nickname || '食光机用户',
                    healthGoal: healthGoal
                }
            });

            console.log('设置到页面的用户信息:', {
                avatarUrl: avatarUrl || '/assets/images/default-avatar.png',
                nickName: userInfo.nickname || '食光机用户',
                healthGoal: healthGoal
            });
        } else {
            console.log('未找到有效的用户信息');

            // 使用默认值
            this.setData({
                userInfo: {
                    avatarUrl: '/assets/images/default-avatar.png',
                    nickName: '食光机用户',
                    healthGoal: '减脂模式 | 每日<1500kcal'
                }
            });
        }
    },

    getMemberInfo: function () {
        // 从服务器获取会员信息
        // 示例代码，实际应用中需要替换为真实的API调用
        const memberInfo = {
            level: '铂金会员',
            consultRemaining: '无限次',
            points: 1280
        };
        this.setData({
            memberInfo: memberInfo
        });
    },

    // 获取用户热量目标
    getCalorieTarget: function () {
        // 从服务器或本地存储获取用户设置的热量目标
        // 示例代码，实际应用中需要替换为真实的API调用
        const target = wx.getStorageSync('calorieTarget') || 1500;
        this.setData({
            calorieTarget: target
        });
    },

    // 设置热量目标
    setCalorieTarget: function () {
        wx.navigateTo({
            url: '/pages/settings/calorie-target/calorie-target'
        });
    },

    // 设置营养元素目标
    setNutritionElementsTarget: function () {
        wx.navigateTo({
            url: '/pages/settings/nutrition-elements-target/nutrition-elements-target'
        });
    },

    // 切换家庭模式
    switchFamilyMode: function () {
        wx.navigateTo({
            url: '/pages/family/family'
        });
    },

    // 管理饮食禁忌
    manageDietaryRestrictions: function () {
        wx.navigateTo({
            url: '/pages/restrictions/restrictions'
        });
    },

    // 显示保质期提醒时间选择器
    setExpiryReminder: function () {
        this.setData({
            showExpiryPickerModal: true
        });
    },

    // 关闭保质期提醒时间选择器
    closeExpiryPicker: function () {
        this.setData({
            showExpiryPickerModal: false
        });
    },

    // 选择保质期提醒时间
    selectExpiryReminderTime: function (e) {
        const reminderTime = parseInt(e.currentTarget.dataset.time);

        this.setData({
            expiryReminderTime: reminderTime,
            showExpiryPickerModal: false
        });

        // 保存到本地存储
        wx.setStorageSync('expiryReminderTime', reminderTime);

        wx.showToast({
            title: '设置已保存',
            icon: 'success',
            duration: 1500
        });
    },

    // 显示保质期提醒时间的文字
    formatReminderTime: function (hours) {
        if (hours < 24) {
            return `${hours}小时`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
        }
    },

    // 设置推送偏好
    setPushPreferences: function () {
        wx.navigateTo({
            url: '/pages/settings/push-preferences/push-preferences'
        });
    },

    // 咨询营养师
    consultNutritionist: function () {
        wx.navigateTo({
            url: '/pages/services/nutritionist'
        });
    },

    // 导航到会员中心
    navigateToMemberCenter: function () {
        wx.navigateTo({
            url: '/pages/member/center'
        });
    },

    // 导航到积分商城
    navigateToPointsMall: function () {
        wx.navigateTo({
            url: '/pages/member/points-mall'
        });
    },

    // 导航到帮助与反馈
    navigateToHelp: function () {
        wx.navigateTo({
            url: '/pages/help/help'
        });
    },

    // 导航到隐私政策
    navigateToPrivacyPolicy: function () {
        wx.navigateTo({
            url: '/pages/legal/privacy-policy/privacy-policy'
        });
    },

    // 导航到用户协议
    navigateToUserAgreement: function () {
        wx.navigateTo({
            url: '/pages/legal/user-agreement/user-agreement'
        });
    },

    // 导航到关于页面
    navigateToAbout: function () {
        wx.navigateTo({
            url: '/pages/about/about'
        });
    },

    // 防止模态框背景滚动
    preventTouchMove: function () {
        return false;
    },

    // 显示用户信息编辑弹窗
    showEditUserInfo: function () {
        // 初始化编辑表单数据
        const healthGoalIndex = this.data.healthGoalOptions.findIndex(goal =>
            goal === this.data.userInfo.healthGoal
        );

        this.setData({
            editUserInfo: {
                avatarUrl: this.data.userInfo.avatarUrl,
                nickname: this.data.userInfo.nickName,
                healthGoal: this.data.userInfo.healthGoal
            },
            healthGoalIndex: healthGoalIndex >= 0 ? healthGoalIndex : 0,
            showEditUserInfoModal: true,
            canSave: true
        });

        console.log('打开编辑用户信息弹窗:', this.data.editUserInfo);
    },

    // 关闭用户信息编辑弹窗
    closeEditUserInfo: function () {
        this.setData({
            showEditUserInfoModal: false
        });
    },

    // 选择头像
    onChooseAvatar: function (e) {
        console.log('选择头像结果:', e);
        const { avatarUrl } = e.detail;
        this.setData({
            'editUserInfo.avatarUrl': avatarUrl,
            canSave: !!this.data.editUserInfo.nickname // 只要昵称不为空，就可以保存
        });
    },

    // 昵称输入事件
    onNicknameInput: function (e) {
        const nickname = e.detail.value.trim();
        this.setData({
            'editUserInfo.nickname': nickname,
            canSave: !!nickname // 只要昵称不为空，就可以保存
        });
    },

    // 健康目标选择事件
    onHealthGoalChange: function (e) {
        const index = e.detail.value;
        const healthGoal = this.data.healthGoalOptions[index];
        this.setData({
            healthGoalIndex: index,
            'editUserInfo.healthGoal': healthGoal
        });
    },

    // 保存用户信息
    saveUserInfo: function () {
        const { avatarUrl, nickname, healthGoal } = this.data.editUserInfo;

        if (!nickname) {
            wx.showToast({
                title: '昵称不能为空',
                icon: 'none',
                duration: 1500
            });
            return;
        }

        // 显示加载中提示
        wx.showLoading({
            title: '保存中...',
        });

        console.log('保存前的用户信息:', {
            'editUserInfo': this.data.editUserInfo,
            'app.globalData.userInfo': getApp().globalData.userInfo,
            '本地存储userInfo': wx.getStorageSync('userInfo')
        });

        let updatePromise;

        // 检查是否需要上传新头像
        if (avatarUrl && avatarUrl !== this.data.userInfo.avatarUrl &&
            (avatarUrl.startsWith('wx://tmp/') || avatarUrl.startsWith('http://tmp/'))) {
            // 如果选择了新头像且是临时文件，先通过uploadAvatar上传
            updatePromise = api.uploadAvatar(avatarUrl)
                .then(newAvatarUrl => {
                    console.log('头像上传成功，新URL:', newAvatarUrl);
                    return newAvatarUrl;
                });
        } else {
            // 没有新头像或者头像已经是网络路径，直接使用原值
            updatePromise = Promise.resolve(avatarUrl);
        }

        // 上传头像完成后（或者不需要上传头像）更新用户信息
        updatePromise.then(finalAvatarUrl => {
            // 根据情况决定是否需要包含头像URL
            const updateData = {
                nickname: nickname,
                healthGoal: healthGoal
            };

            // 只有当头像URL有效且不是默认头像时，才包含在更新数据中
            if (finalAvatarUrl && finalAvatarUrl !== '/assets/images/default-avatar.png') {
                updateData.avatarUrl = finalAvatarUrl;
            }

            // 调用API更新用户信息
            return api.request({
                url: '/user/update',
                method: 'POST',
                data: updateData
            });
        })
            .then(res => {
                console.log('更新用户信息成功:', res);

                if (res && res.code === 0 && res.data && res.data.userInfo) {
                    const updatedUserInfo = res.data.userInfo;

                    // 更新本地显示
                    this.setData({
                        'userInfo.avatarUrl': api.getFullImageUrl(updatedUserInfo.avatarUrl),
                        'userInfo.nickName': updatedUserInfo.nickname,
                        'userInfo.healthGoal': updatedUserInfo.healthGoal,
                        showEditUserInfoModal: false
                    });

                    // 更新全局状态和本地存储
                    const app = getApp();
                    app.globalData.userInfo = updatedUserInfo;
                    wx.setStorageSync('userInfo', updatedUserInfo);

                    console.log('保存后的用户信息:', {
                        '页面显示': this.data.userInfo,
                        '全局状态': app.globalData.userInfo,
                        '本地存储': updatedUserInfo
                    });

                    wx.hideLoading();
                    wx.showToast({
                        title: '已保存',
                        icon: 'success',
                        duration: 1500
                    });
                } else {
                    throw new Error(res.message || '更新用户信息失败');
                }
            })
            .catch(error => {
                wx.hideLoading();
                wx.showToast({
                    title: '保存失败: ' + error.message,
                    icon: 'none',
                    duration: 2000
                });
                console.error('保存用户信息失败:', error);
            });
    }
})