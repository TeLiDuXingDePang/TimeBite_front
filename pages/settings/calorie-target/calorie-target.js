// calorie-target.js
Page({
    data: {
        currentCalorie: 1500,
        goalType: 'weightLoss', // 默认减脂目标
        bmr: 1600, // 基础代谢率
        activityLevels: ['久坐不动', '轻度活动', '中度活动', '高度活动', '极高活动'],
        activityLevelIndex: 1, // 默认轻度活动
        suggestedMin: 0,
        suggestedMax: 0
    },

    onLoad: function () {
        // 获取本地存储的卡路里目标值
        const savedCalorie = wx.getStorageSync('calorieTarget');
        const savedGoalType = wx.getStorageSync('goalType') || 'weightLoss';
        const savedActivityLevel = wx.getStorageSync('activityLevelIndex') || 1;

        // 如果有保存的值，则使用它
        if (savedCalorie) {
            this.setData({
                currentCalorie: savedCalorie,
                goalType: savedGoalType,
                activityLevelIndex: savedActivityLevel
            });
        }

        // 计算BMR（使用假数据示例）
        // 实际应用中应该从用户个人资料获取身高、体重、年龄、性别等数据计算
        this.calculateBMR();

        // 计算建议热量范围
        this.calculateSuggestedRange();
    },

    // 滑块值变化处理
    onCalorieChange: function (e) {
        const value = e.detail.value;
        this.setData({
            currentCalorie: value
        });
    },

    // 健康目标变化处理
    onGoalChange: function (e) {
        const value = e.detail.value;
        this.setData({
            goalType: value
        });

        // 根据目标重新计算建议范围
        this.calculateSuggestedRange();

        // 自动设置到建议范围的中间值
        const midValue = Math.round((this.data.suggestedMin + this.data.suggestedMax) / 2);
        this.setData({
            currentCalorie: midValue
        });
    },

    // 活动水平变化处理
    onActivityLevelChange: function (e) {
        const index = e.detail.value;
        this.setData({
            activityLevelIndex: index
        });

        // 重新计算建议范围
        this.calculateSuggestedRange();
    },

    // 计算BMR（基础代谢率）
    // 实际应用中应该使用Mifflin-St Jeor方程或其他公式
    calculateBMR: function () {
        // 此处使用假数据
        // 实际应用中应该获取用户的身高、体重、年龄、性别等数据
        const bmr = 1600; // 示例值

        this.setData({
            bmr: bmr
        });
    },

    // 计算建议热量范围
    calculateSuggestedRange: function () {
        const { bmr, goalType, activityLevelIndex } = this.data;

        // 活动因子
        const activityFactors = [1.2, 1.375, 1.55, 1.725, 1.9];
        const activityFactor = activityFactors[activityLevelIndex];

        // 基础TDEE（每日总能量消耗）
        const tdee = Math.round(bmr * activityFactor);

        let min = 0, max = 0;

        // 根据目标计算建议范围
        switch (goalType) {
            case 'weightLoss':
                min = Math.round(tdee * 0.8);
                max = Math.round(tdee * 0.9);
                break;
            case 'maintenance':
                min = Math.round(tdee * 0.95);
                max = Math.round(tdee * 1.05);
                break;
            case 'muscleGain':
                min = Math.round(tdee * 1.1);
                max = Math.round(tdee * 1.2);
                break;
        }

        this.setData({
            suggestedMin: min,
            suggestedMax: max
        });
    },

    // 保存设置
    saveCalorieTarget: function () {
        const { currentCalorie, goalType, activityLevelIndex } = this.data;

        // 保存到本地存储
        wx.setStorageSync('calorieTarget', currentCalorie);
        wx.setStorageSync('goalType', goalType);
        wx.setStorageSync('activityLevelIndex', activityLevelIndex);

        // 显示保存成功提示
        wx.showToast({
            title: '设置已保存',
            icon: 'success',
            duration: 2000
        });

        // 返回上一页
        setTimeout(() => {
            wx.navigateBack();
        }, 1500);
    }
})