// plan.js
Page({
    data: {
        currentDate: '',
        selectedDate: '',
        weekDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        currentWeekDates: [],
        mealPlans: {
            // 示例数据结构
            '2025-03-15': {
                breakfast: {
                    id: 1,
                    name: '牛奶麦片',
                    image: '/assets/recipes/breakfast1.svg',
                    calories: 320,
                    protein: 12,
                    fat: 8,
                    carbs: 45
                },
                lunch: {
                    id: 2,
                    name: '番茄炒蛋',
                    image: '/assets/recipes/recipe1.svg',
                    calories: 420,
                    protein: 18,
                    fat: 15,
                    carbs: 30
                },
                dinner: {
                    id: 3,
                    name: '青椒土豆丝',
                    image: '/assets/recipes/recipe2.svg',
                    calories: 380,
                    protein: 10,
                    fat: 12,
                    carbs: 50
                }
            },
            '2025-03-16': {
                breakfast: {
                    id: 4,
                    name: '三明治',
                    image: '/assets/recipes/breakfast2.svg',
                    calories: 350,
                    protein: 15,
                    fat: 12,
                    carbs: 40
                },
                lunch: {
                    id: 5,
                    name: '香煎鸡胸肉',
                    image: '/assets/recipes/recipe3.svg',
                    calories: 450,
                    protein: 35,
                    fat: 18,
                    carbs: 10
                },
                dinner: null // 空槽位
            }
        },
        recommendedRecipes: [
            {
                id: 101,
                name: '西红柿炖牛腩',
                image: '/assets/recipes/recipe1.svg',
                matchRate: 95,
                calories: 520
            },
            {
                id: 102,
                name: '蒜蓉西兰花',
                image: '/assets/recipes/recipe2.svg',
                matchRate: 88,
                calories: 180
            },
            {
                id: 103,
                name: '清蒸鲈鱼',
                image: '/assets/recipes/recipe3.svg',
                matchRate: 92,
                calories: 320
            }
        ],
        showRecommendModal: false,
        currentMealSlot: null,
        currentMealDate: null
    },

    onLoad: function () {
        this.updateDate();
        this.initWeekDates();

        // 默认选中今天
        const today = this.formatDate(new Date());
        this.setData({
            selectedDate: today
        });

        // 确保当天的mealPlans数据结构存在
        this.initMealPlanForDate(today);
    },

    onShow: function () {
        this.updateDate();
        // 确保当前选择日期的餐饮计划数据结构存在
        this.initMealPlanForDate(this.data.selectedDate);
    },

    updateDate: function () {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekDay = weekDays[now.getDay()];

        const dateString = `${year}年${month}月${day}日 ${weekDay}`;
        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        this.setData({
            currentDate: dateString,
            selectedDate: formattedDate
        });
    },

    initWeekDates: function () {
        const today = new Date();
        const weekDates = [];

        // 获取本周的日期
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - today.getDay() + i);

            const day = date.getDate();
            const fullDate = this.formatDate(date);
            const isToday = this.isToday(date);

            weekDates.push({
                day: day,
                weekDay: this.data.weekDays[i],
                fullDate: fullDate,
                isToday: isToday
            });
        }

        this.setData({
            currentWeekDates: weekDates
        });
    },

    formatDate: function (date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    isToday: function (date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    },

    selectDate: function (e) {
        const date = e.currentTarget.dataset.date;
        this.setData({
            selectedDate: date
        });

        // 确保当天的mealPlans数据结构存在
        this.initMealPlanForDate(date);
    },

    showRecommendations: function (e) {
        const meal = e.currentTarget.dataset.meal;
        const date = e.currentTarget.dataset.date;

        // 确保当天的mealPlans数据结构存在
        this.initMealPlanForDate(date);

        // 如果已经有餐饮计划，不显示推荐
        if (this.data.mealPlans[date][meal]) {
            return;
        }

        this.setData({
            showRecommendModal: true,
            currentMealSlot: meal,
            currentMealDate: date
        });

        // 这里可以根据meal类型和用户偏好获取不同的推荐菜谱
        // 示例中使用相同的推荐列表
    },

    hideRecommendModal: function () {
        this.setData({
            showRecommendModal: false
        });
    },

    selectRecipe: function (e) {
        const recipeId = e.currentTarget.dataset.id;
        const recipe = this.data.recommendedRecipes.find(item => item.id === recipeId);

        if (recipe && this.data.currentMealSlot && this.data.currentMealDate) {
            // 添加更多营养信息
            const fullRecipe = {
                ...recipe,
                protein: Math.floor(Math.random() * 20) + 10, // 模拟数据
                fat: Math.floor(Math.random() * 15) + 5,
                carbs: Math.floor(Math.random() * 30) + 20
            };

            // 更新餐饮计划
            const mealPlans = this.data.mealPlans;
            mealPlans[this.data.currentMealDate][this.data.currentMealSlot] = fullRecipe;

            this.setData({
                mealPlans: mealPlans,
                showRecommendModal: false
            });

            wx.showToast({
                title: '已添加到计划',
                icon: 'success'
            });
        }
    },

    editMeal: function (e) {
        const meal = e.currentTarget.dataset.meal;
        const date = e.currentTarget.dataset.date;

        // 这里可以跳转到编辑页面或显示编辑弹窗
        // 示例中简单显示一个提示
        wx.showToast({
            title: '编辑功能开发中',
            icon: 'none'
        });
    },

    deleteMeal: function (e) {
        const meal = e.currentTarget.dataset.meal;
        const date = e.currentTarget.dataset.date;

        // 确保当天的mealPlans数据结构存在
        this.initMealPlanForDate(date);

        wx.showModal({
            title: '确认删除',
            content: '确定要删除这个餐饮计划吗？',
            success: (res) => {
                if (res.confirm) {
                    // 删除餐饮计划
                    const mealPlans = this.data.mealPlans;
                    mealPlans[date][meal] = null;

                    this.setData({
                        mealPlans: mealPlans
                    });

                    wx.showToast({
                        title: '已删除',
                        icon: 'success'
                    });
                }
            }
        });
    },

    generateShoppingList: function () {
        wx.showModal({
            title: '功能开发中',
            content: '生成购物清单功能正在开发中，该功能将根据您的膳食计划自动生成所需食材的购物清单，帮助您高效采购。',
            confirmText: '我知道了',
            confirmColor: '#07c160',
            showCancel: false
        });
        console.log('用户点击了生成购物清单按钮');
    },

    shareWeekPlan: function () {
        wx.showModal({
            title: '即将上线',
            content: '分享食谱计划功能即将上线，该功能将允许您将精心规划的食谱计划分享给家人和朋友，一起享用健康美食。',
            confirmText: '期待使用',
            confirmColor: '#07c160',
            showCancel: false
        });
        console.log('用户点击了分享食谱计划按钮');
    },

    onShareAppMessage: function () {
        return {
            title: '我的本周食谱计划',
            path: '/pages/plan/plan',
            imageUrl: '/assets/share/meal-plan.png'
        };
    },

    // 初始化指定日期的餐饮计划数据结构
    initMealPlanForDate: function (date) {
        if (!this.data.mealPlans[date]) {
            const mealPlans = this.data.mealPlans;
            mealPlans[date] = {
                breakfast: null,
                lunch: null,
                dinner: null
            };
            this.setData({
                mealPlans: mealPlans
            });
        }
    }
})