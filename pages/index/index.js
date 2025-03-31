// index.js
const router = require('../../utils/router');
const api = require('../../utils/api');

Page({
    data: {
        currentDate: '',
        recipes: [], // 初始化为空数组，将通过API获取数据
        expiringIngredient: null, // 初始化为null，将通过API获取数据
        hasExpiringIngredient: false, // 是否有过期食材
        isLoadingExpiring: true, // 过期食材加载状态
        isLoading: true, // 添加加载状态
        loadError: false, // 添加错误状态
        // 添加食材库存统计数据
        ingredientsStats: {
            total_count: 0,
            fresh_count: 0,
            expiring_count: 0,
            expired_count: 0,
            isLoading: true, // 食材统计数据加载状态
            loadError: false // 食材统计数据加载错误状态
        }
    },

    onLoad() {
        // 首先确保更新应用的登录状态
        const app = getApp();
        app.checkLoginStatus();

        // 检查登录状态，未登录则跳转到登录页
        if (!router.checkLogin()) {
            return;
        }

        // 格式化日期显示
        this.updateDate();

        // 获取菜谱推荐数据
        this.fetchRecipeRecommendations();

        // 获取食材库存统计数据
        this.fetchIngredientsStats();

        // 获取最快过期的食材
        this.fetchMostExpiringIngredient();
    },

    onShow: function () {
        // 重新检查登录状态
        const app = getApp();
        app.checkLoginStatus();

        this.updateDate();

        // 每次显示页面时刷新食材库存统计数据
        this.fetchIngredientsStats();

        // 每次显示页面时刷新最快过期的食材
        this.fetchMostExpiringIngredient();
    },

    // 获取最快过期的食材
    fetchMostExpiringIngredient: function () {
        // 设置加载状态
        this.setData({
            isLoadingExpiring: true,
            hasExpiringIngredient: false
        });

        // 调用API获取最快过期的食材
        api.getMostExpiringIngredient()
            .then(res => {
                console.log('成功获取最快过期食材:', res);

                if (res.code === 200 && res.data) {
                    // 更新数据状态
                    this.setData({
                        expiringIngredient: res.data,
                        hasExpiringIngredient: true,
                        isLoadingExpiring: false
                    });
                } else if (res.code === 404) {
                    // 没有设置过期日期的食材
                    console.log('没有找到设置过期日期的食材');
                    this.setData({
                        expiringIngredient: null,
                        hasExpiringIngredient: false,
                        isLoadingExpiring: false
                    });
                } else {
                    console.error('获取最快过期食材数据格式异常:', res);
                    this.setData({
                        expiringIngredient: null,
                        hasExpiringIngredient: false,
                        isLoadingExpiring: false
                    });
                }
            })
            .catch(err => {
                console.error('获取最快过期食材失败:', err);
                this.setData({
                    expiringIngredient: null,
                    hasExpiringIngredient: false,
                    isLoadingExpiring: false
                });
            });
    },

    // 获取食材库存统计数据
    fetchIngredientsStats: function () {
        // 设置加载状态
        this.setData({
            'ingredientsStats.isLoading': true,
            'ingredientsStats.loadError': false
        });

        // 调用API获取食材库存统计数据
        api.getIngredientsStats()
            .then(res => {
                console.log('成功获取食材库存统计:', res);

                if (res.code === 200 && res.data) {
                    // 更新数据状态
                    this.setData({
                        'ingredientsStats.total_count': res.data.total_count || 0,
                        'ingredientsStats.fresh_count': res.data.fresh_count || 0,
                        'ingredientsStats.expiring_count': res.data.expiring_count || 0,
                        'ingredientsStats.expired_count': res.data.expired_count || 0,
                        'ingredientsStats.isLoading': false
                    });


                } else {
                    console.error('食材库存统计数据格式异常:', res);
                    this.setData({
                        'ingredientsStats.isLoading': false,
                        'ingredientsStats.loadError': true
                    });
                }
            })
            .catch(err => {
                console.error('获取食材库存统计失败:', err);
                this.setData({
                    'ingredientsStats.isLoading': false,
                    'ingredientsStats.loadError': true
                });
            });
    },

    // 获取菜谱推荐
    fetchRecipeRecommendations: function () {
        // 设置加载状态
        this.setData({
            isLoading: true,
            loadError: false
        });

        // 调用API获取推荐菜谱，限制数量为5个
        api.getRecipeRecommendations({ limit: 5 })
            .then(res => {
                console.log('成功获取菜谱推荐:', res);

                if (res.code === 200 && res.data && res.data.recommendations) {
                    // 处理API返回的数据，格式化为页面所需格式
                    const recipes = res.data.recommendations.map(item => {
                        return {
                            id: item.id,
                            name: item.name,
                            // 处理图像URL，确保完整路径
                            image: api.getFullImageUrl(item.image),
                            matchRate: item.match_rate ? Math.round(item.match_rate) : 0,
                            cookTime: item.cook_time || 0,
                            calories: item.calories || 0,
                            // 生成标签，根据菜谱特点
                            tags: this.generateTags(item)
                        };
                    });

                    // 更新数据状态
                    this.setData({
                        recipes: recipes,
                        isLoading: false
                    });
                } else {
                    console.error('菜谱推荐数据格式异常:', res);
                    this.setData({
                        loadError: true,
                        isLoading: false
                    });
                    // 提示用户
                    wx.showToast({
                        title: '获取菜谱数据失败',
                        icon: 'none'
                    });
                }
            })
            .catch(err => {
                console.error('获取菜谱推荐失败:', err);
                this.setData({
                    loadError: true,
                    isLoading: false
                });
                // 提示用户
                wx.showToast({
                    title: '网络错误，请稍后再试',
                    icon: 'none'
                });
            });
    },

    // 根据菜谱信息生成标签
    generateTags: function (recipe) {
        const tags = [];

        // 根据烹饪时间生成标签
        if (recipe.cook_time && recipe.cook_time <= 15) {
            tags.push({ text: '15分钟快手', type: 'quick' });
        }

        // 根据匹配度生成标签
        if (recipe.match_rate && recipe.match_rate >= 80) {
            tags.push({ text: '库存匹配', type: 'stock' });
        }

        // 根据卡路里生成标签
        if (recipe.calories && recipe.calories < 300) {
            tags.push({ text: '低卡路里', type: 'health' });
        } else if (recipe.calories && recipe.calories >= 500) {
            tags.push({ text: '高能量', type: 'energy' });
        }

        // 根据匹配的食材数量生成标签
        if (recipe.matching_ingredients && recipe.matching_ingredients > 3) {
            tags.push({ text: '清库存', type: 'stock' });
        }

        // 限制最多显示2个标签
        return tags.slice(0, 2);
    },

    updateDate: function () {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekDay = weekDays[now.getDay()];

        const dateString = `${year}年${month}月${day}日 ${weekDay}`;

        this.setData({
            currentDate: dateString
        });
    },

    navigateToInventory: function () {
        console.log('点击了管理库存按钮');
        router.navigateTo('/pages/inventory/inventory');
    },

    // 导航到临期急救站页面
    navigateToExpiringRecipes: function () {
        console.log('点击了临期食材提醒');

        // 如果没有过期食材数据，则提示用户
        if (!this.data.hasExpiringIngredient) {
            wx.showToast({
                title: '没有临期食材',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 将后端返回的过期食材数据转换为临期急救站所需的格式
        const expiringIngredient = this.data.expiringIngredient;
        const ingredientsForRescue = [{
            name: expiringIngredient.name,
            quantity: expiringIngredient.quantity,
            unit: expiringIngredient.unit,
            expiryDays: expiringIngredient.days_until_expiry
        }];

        // 将临期食材数据转换为查询参数
        const ingredientsParam = encodeURIComponent(JSON.stringify(ingredientsForRescue));

        // 导航到临期急救站页面
        wx.navigateTo({
            url: `/pages/expiring-recipes/expiring-recipes?ingredients=${ingredientsParam}`,
            success: function () {
                console.log('导航到临期急救站成功');
            },
            fail: function (error) {
                console.error('导航到临期急救站失败', error);
                // 如果页面不存在，提示用户
                wx.showToast({
                    title: '临期急救站页面正在开发中',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    // 导航到菜谱详情页
    navigateToRecipeDetail: function (e) {
        console.log('点击了菜谱卡片');

        // 获取点击的菜谱数据
        const recipe = e.currentTarget.dataset.recipe;

        // 显示加载提示
        wx.showLoading({
            title: '加载菜谱详情...',
            mask: true
        });

        // 调用API获取完整的菜谱详情
        api.getRecipeDetail(recipe.id)
            .then(res => {
                wx.hideLoading();

                if (res.code === 200 && res.data) {
                    console.log('菜谱详情获取成功:', res.data);

                    // 处理图片URL，确保完整路径
                    const recipeDetail = res.data;
                    recipeDetail.image = api.getFullImageUrl(recipeDetail.image);

                    // 处理步骤图片URL
                    if (recipeDetail.steps && recipeDetail.steps.length > 0) {
                        recipeDetail.steps.forEach(step => {
                            if (step.image) {
                                step.image = api.getFullImageUrl(step.image);
                            }
                        });
                    }

                    // 导航到菜谱详情页，传递菜谱详情数据
                    wx.navigateTo({
                        url: `/pages/recipe-detail/recipe-detail?id=${recipeDetail.id}`,
                        success: function (res) {
                            // 在页面打开成功后，通过事件通道传递完整的菜谱数据
                            // 这样避免了URL长度限制的问题
                            res.eventChannel.emit('acceptDataFromOpenerPage', { recipeDetail: recipeDetail });
                            console.log('导航到菜谱详情页成功');
                        },
                        fail: function (error) {
                            console.error('导航到菜谱详情页失败', error);
                            wx.showToast({
                                title: '菜谱详情页加载失败',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    });
                } else {
                    console.error('获取菜谱详情失败:', res);
                    wx.showToast({
                        title: '获取菜谱详情失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            })
            .catch(err => {
                wx.hideLoading();
                console.error('获取菜谱详情出错:', err);
                wx.showToast({
                    title: '网络错误，请稍后再试',
                    icon: 'none',
                    duration: 2000
                });
            });
    },

    // 刷新菜谱推荐
    refreshRecipes: function () {
        this.fetchRecipeRecommendations();
    },

    // 刷新食材库存统计
    refreshIngredientStats: function () {
        this.fetchIngredientsStats();
    },

    // 生成本周食谱功能
    generateWeeklyMenu: function () {
        wx.showModal({
            title: '功能开发中',
            content: '生成本周食谱功能正在开发中，我们将尽快推出这项功能，帮助您更便捷地规划一周餐饮。',
            confirmText: '我知道了',
            confirmColor: '#07c160',
            showCancel: false
        });
        console.log('用户点击了生成本周食谱按钮');
    },

    // 一键补货功能
    oneClickReplenish: function () {
        wx.showModal({
            title: '即将上线',
            content: '一键补货功能即将上线，该功能将帮助您根据当前库存自动生成购物清单，轻松补充所需食材。',
            confirmText: '期待使用',
            confirmColor: '#07c160',
            showCancel: false
        });
        console.log('用户点击了一键补货按钮');
    }
})
