// expiring-recipes.js
const api = require('../../utils/api');
const router = require('../../utils/router');

Page({
    data: {
        expiringIngredients: [],
        isLoading: true,
        loadError: false,
        recipes: [],
        urgencyLevels: [
            { level: 'red', days: 1, label: '1天内过期' },
            { level: 'orange', days: 3, label: '3天内过期' },
            { level: 'yellow', days: 5, label: '5天内过期' }
        ]
    },

    onLoad: function (options) {
        // 首先确保用户已登录
        const app = getApp();
        app.checkLoginStatus();

        // 检查登录状态，未登录则跳转到登录页
        if (!router.checkLogin()) {
            return;
        }

        // 获取最快过期的食材列表
        this.fetchTopExpiringIngredients();

        // 从URL参数中获取临期食材数据（兼容旧版本传参方式）
        if (options.ingredients) {
            try {
                const ingredients = JSON.parse(decodeURIComponent(options.ingredients));

                // 如果API获取数据失败，则使用URL参数中的数据
                this.setData({
                    expiringIngredients: ingredients,
                    // 如果是从URL参数获取的数据，则不显示加载状态
                    isLoading: false
                });

                // 获取推荐菜谱
                this.getRecommendedRecipes(ingredients);
            } catch (error) {
                console.error('解析临期食材数据失败', error);

                // 如果URL参数解析失败且API没有返回数据，则显示错误提示
                if (this.data.isLoading) {
                    this.setData({
                        loadError: true,
                        isLoading: false
                    });

                    wx.showToast({
                        title: '加载数据失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            }
        }
    },

    // 获取最快过期的食材列表
    fetchTopExpiringIngredients: function () {
        // 设置加载状态
        this.setData({
            isLoading: true,
            loadError: false
        });

        // 调用API获取最快过期的食材列表
        api.getTopExpiringIngredients()
            .then(res => {
                console.log('成功获取最快过期食材列表:', res);

                if (res.code === 200 && res.data && res.data.ingredients) {
                    // 将API返回的数据转换为页面所需的格式
                    const expiringIngredients = res.data.ingredients.map(item => {
                        return {
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                            unit: item.unit,
                            expiryDays: item.days_until_expiry,
                            // 根据名称生成默认图片路径
                            image: `/assets/ingredients/${item.name}.svg`
                        };
                    });

                    // 更新数据状态
                    this.setData({
                        expiringIngredients: expiringIngredients,
                        isLoading: false
                    });

                    // 获取推荐菜谱
                    this.getRecommendedRecipes(expiringIngredients);
                } else if (res.code === 404) {
                    // 没有设置过期日期的食材
                    console.log('没有找到设置过期日期的食材');
                    this.setData({
                        expiringIngredients: [],
                        isLoading: false
                    });

                    // 显示提示
                    wx.showToast({
                        title: '没有临期食材',
                        icon: 'none',
                        duration: 2000
                    });
                } else {
                    console.error('获取最快过期食材列表数据格式异常:', res);
                    this.setData({
                        loadError: true,
                        isLoading: false
                    });

                    // 显示错误提示
                    wx.showToast({
                        title: '获取临期食材失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            })
            .catch(err => {
                console.error('获取最快过期食材列表失败:', err);
                this.setData({
                    loadError: true,
                    isLoading: false
                });

                // 显示错误提示
                wx.showToast({
                    title: '网络错误，请稍后再试',
                    icon: 'none',
                    duration: 2000
                });
            });
    },

    // 处理图片加载错误
    handleImageError: function (e) {
        const index = e.currentTarget.dataset.index;
        // 设置默认图片
        const defaultImage = '/assets/ingredients/default.svg';

        // 更新图片路径
        let updatedIngredients = this.data.expiringIngredients;
        updatedIngredients[index].image = defaultImage;

        this.setData({
            expiringIngredients: updatedIngredients
        });
    },

    // 处理菜谱图片加载错误
    handleRecipeImageError: function (e) {
        const index = e.currentTarget.dataset.index;
        // 设置默认图片
        const defaultImage = '/assets/recipes/default-recipe.svg';

        // 更新图片路径
        let updatedRecipes = this.data.recipes;
        updatedRecipes[index].image = defaultImage;

        this.setData({
            recipes: updatedRecipes
        });
    },

    // 刷新菜谱推荐
    refreshRecipes: function () {
        // 重新获取菜谱推荐
        this.getRecommendedRecipes(this.data.expiringIngredients);
    },

    // 返回首页
    goBack: function () {
        wx.navigateBack({
            fail: function () {
                // 如果返回失败，则跳转到首页
                wx.switchTab({
                    url: '/pages/index/index'
                });
            }
        });
    },

    // 获取推荐菜谱
    getRecommendedRecipes: function (ingredients) {
        // 显示加载中提示
        wx.showLoading({
            title: '加载推荐菜谱...',
        });

        // 在数据中添加菜谱加载状态
        this.setData({
            isLoadingRecipes: true,
            loadErrorRecipes: false,
            recipes: []
        });

        // 调用API获取基于过期食材的推荐菜谱
        // 默认获取5个最快过期的食材和最多5个匹配的菜谱
        api.getMatchingRecipesForExpiring({ count: 5 })
            .then(res => {
                console.log('成功获取匹配菜谱:', res);

                if (res.code === 200 && res.data && res.data.recipes && res.data.recipes.length > 0) {
                    // 将API返回的数据转换为页面所需的格式
                    const recipes = res.data.recipes.map(item => {
                        // 确定紧急度级别，基于匹配分数
                        let urgency = 'yellow';
                        if (item.matching_score >= 80) {
                            urgency = 'red';
                        } else if (item.matching_score >= 50) {
                            urgency = 'orange';
                        }

                        // 确定匹配度等级
                        let matchClass = '';
                        if (item.matching_score >= 90) {
                            matchClass = 'match-excellent';
                        } else if (item.matching_score >= 70) {
                            matchClass = 'match-good';
                        } else if (item.matching_score >= 50) {
                            matchClass = 'match-fair';
                        } else {
                            matchClass = 'match-low';
                        }

                        // 提取匹配的食材名称
                        const matchingIngredients = item.matching_ingredients.map(ingredient => ingredient.name);

                        return {
                            id: item.id,
                            name: item.name,
                            // 使用匹配的食材作为推荐菜谱的食材列表
                            ingredients: matchingIngredients,
                            // 处理图片路径
                            image: api.getFullImageUrl(item.image),
                            // 使用接口返回的烹饪时间
                            cookTime: item.cook_time,
                            calories: item.calories,
                            difficulty: item.difficulty,
                            urgency: urgency,
                            matchRate: item.matching_score,
                            // 提示信息稍后可以添加
                            tip: '',
                            // 添加标签
                            tags: item.tags,
                            matchClass: matchClass
                        };
                    });

                    this.setData({
                        recipes: recipes,
                        isLoadingRecipes: false
                    });

                    wx.hideLoading();
                } else if (res.code === 404) {
                    // 没有找到匹配的菜谱
                    console.log('没有找到匹配的菜谱');
                    this.setData({
                        recipes: [],
                        isLoadingRecipes: false
                    });

                    wx.hideLoading();

                    // 显示提示
                    wx.showToast({
                        title: '未找到匹配的菜谱',
                        icon: 'none',
                        duration: 2000
                    });
                } else {
                    console.error('获取匹配菜谱数据格式异常:', res);
                    this.setData({
                        loadErrorRecipes: true,
                        isLoadingRecipes: false
                    });

                    wx.hideLoading();

                    // 显示错误提示
                    wx.showToast({
                        title: '获取推荐菜谱失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            })
            .catch(err => {
                console.error('获取匹配菜谱失败:', err);
                this.setData({
                    loadErrorRecipes: true,
                    isLoadingRecipes: false
                });

                wx.hideLoading();

                // 显示错误提示
                wx.showToast({
                    title: '网络错误，请稍后再试',
                    icon: 'none',
                    duration: 2000
                });
            });
    },

    // 查看菜谱详情
    viewRecipeDetail: function (e) {
        const recipeId = e.currentTarget.dataset.id;

        if (recipeId) {
            // 导航到菜谱详情页，直接使用ID
            wx.navigateTo({
                url: `/pages/recipe-detail/recipe-detail?id=${recipeId}`
            });
        }
    }
}) 