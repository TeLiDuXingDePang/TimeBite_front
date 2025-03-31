// recipe-detail.js
const api = require('../../utils/api');

Page({
    data: {
        recipe: null,
        currentTab: 'ingredients', // 默认显示食材标签页
        missingIngredients: []
    },

    onLoad: function (options) {
        console.log('接收到的选项:', options);

        // 通过ID直接获取菜谱详情（推荐方式）
        if (options.id) {
            this.setData({
                isLoading: true
            });

            // 显示加载提示
            wx.showLoading({
                title: '加载菜谱详情...',
                mask: true
            });

            // 调用API获取完整的菜谱详情
            api.getRecipeDetail(options.id)
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

                        // 格式化菜谱数据
                        const formattedRecipe = this.formatRecipeData(recipeDetail);

                        this.setData({
                            recipe: formattedRecipe,
                            isLoading: false
                        });

                        // 设置页面标题
                        wx.setNavigationBarTitle({
                            title: formattedRecipe.name || '菜谱详情'
                        });

                        // 检查食材库存状态
                        this.checkIngredientsStatus();

                        console.log('格式化后的菜谱数据:', formattedRecipe);
                    } else {
                        console.error('获取菜谱详情失败:', res);
                        this.setData({
                            isLoading: false,
                            loadError: true
                        });

                        wx.showToast({
                            title: '获取菜谱详情失败',
                            icon: 'none',
                            duration: 2000
                        });

                        setTimeout(() => {
                            wx.navigateBack();
                        }, 2000);
                    }
                })
                .catch(err => {
                    wx.hideLoading();
                    console.error('获取菜谱详情出错:', err);

                    this.setData({
                        isLoading: false,
                        loadError: true
                    });

                    wx.showToast({
                        title: '网络错误，请稍后再试',
                        icon: 'none',
                        duration: 2000
                    });

                    setTimeout(() => {
                        wx.navigateBack();
                    }, 2000);
                });
        }
        // 从eventChannel获取完整的菜谱详情数据（兼容旧版本）
        else if (options.recipeId) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('acceptDataFromOpenerPage', (data) => {
                console.log('从上一页面获取的菜谱详情数据:', data);
                if (data && data.recipeDetail) {
                    // 处理后端返回的菜谱详情数据
                    const recipeDetail = this.formatRecipeData(data.recipeDetail);

                    this.setData({
                        recipe: recipeDetail
                    });

                    // 设置页面标题
                    wx.setNavigationBarTitle({
                        title: recipeDetail.name || '菜谱详情'
                    });

                    // 检查食材库存状态
                    this.checkIngredientsStatus();

                    console.log('格式化后的菜谱数据:', recipeDetail);
                }
            });
        }
        // 兼容旧版本直接从URL参数获取菜谱数据
        else if (options.recipe) {
            try {
                const recipe = JSON.parse(decodeURIComponent(options.recipe));

                // 处理从临期急救站传递过来的数据，确保数据结构完整
                const processedRecipe = this.processRecipeData(recipe);

                this.setData({
                    recipe: processedRecipe
                });

                // 设置页面标题
                wx.setNavigationBarTitle({
                    title: processedRecipe.name || '菜谱详情'
                });

                // 检查食材库存状态
                this.checkIngredientsStatus();

                console.log('加载的菜谱数据:', processedRecipe);
            } catch (error) {
                console.error('解析菜谱数据失败', error);
                wx.showToast({
                    title: '加载菜谱失败',
                    icon: 'none',
                    duration: 2000
                });

                // 显示错误提示并返回上一页
                setTimeout(() => {
                    wx.navigateBack();
                }, 2000);
            }
        } else {
            // 如果没有传递菜谱数据，提示错误并返回
            wx.showToast({
                title: '菜谱数据不存在',
                icon: 'none',
                duration: 2000
            });

            setTimeout(() => {
                wx.navigateBack();
            }, 2000);
        }
    },

    // 处理菜谱数据，确保数据结构完整
    processRecipeData: function (recipe) {
        // 创建一个基础结构，确保所有必要的字段都存在
        const processedRecipe = {
            id: recipe.id || 0,
            name: recipe.name || '未命名菜谱',
            image: recipe.image || '/assets/recipes/default-recipe.svg',
            brief: recipe.brief || '一道美味又营养的家常菜，简单易做',
            cookTime: recipe.cookTime || 30,
            difficulty: recipe.difficulty || '简单',
            calories: recipe.calories || '未知',
            matchRate: recipe.matchRate || 0,

            // 处理食材数据
            mainIngredients: [],
            accessories: [],
            seasonings: [],

            // 处理工具数据
            tools: [],

            // 处理步骤数据
            preparations: [],
            steps: [],

            // 处理小贴士
            tips: []
        };

        // 如果有原始的mainIngredients，直接使用
        if (recipe.mainIngredients && Array.isArray(recipe.mainIngredients)) {
            processedRecipe.mainIngredients = recipe.mainIngredients;
        }

        // 处理辅料和调料
        if (recipe.accessories && Array.isArray(recipe.accessories)) {
            processedRecipe.accessories = recipe.accessories;
        }

        if (recipe.seasonings && Array.isArray(recipe.seasonings)) {
            processedRecipe.seasonings = recipe.seasonings;
        }

        // 处理工具数据
        if (recipe.tools && Array.isArray(recipe.tools)) {
            // 如果工具是对象数组且含有emoji
            if (typeof recipe.tools[0] === 'object' && recipe.tools[0].emoji) {
                processedRecipe.tools = recipe.tools;
            }
            // 如果工具是对象数组但不含emoji
            else if (typeof recipe.tools[0] === 'object' && !recipe.tools[0].emoji) {
                processedRecipe.tools = recipe.tools.map(tool => {
                    return {
                        name: tool.name,
                        emoji: '🍳', // 默认emoji
                        alternative: tool.alternative || ''
                    };
                });
            }
            // 如果工具是字符串数组
            else if (typeof recipe.tools[0] === 'string') {
                processedRecipe.tools = recipe.tools.map(toolName => {
                    return {
                        name: toolName,
                        emoji: '🍳', // 默认emoji
                        alternative: ''
                    };
                });
            }
        } else {
            // 添加默认工具
            processedRecipe.tools = [
                { name: '炒锅', emoji: '🍳' }
            ];
        }

        // 处理步骤数据
        if (recipe.steps) {
            if (Array.isArray(recipe.steps) && typeof recipe.steps[0] === 'string') {
                // 如果steps是字符串数组，转换为对象数组
                processedRecipe.steps = recipe.steps.map((step, index) => {
                    return {
                        text: step,
                        image: ''
                    };
                });
            } else if (Array.isArray(recipe.steps) && typeof recipe.steps[0] === 'object') {
                // 如果已经是对象数组，直接使用，但移除details属性
                processedRecipe.steps = recipe.steps.map(step => {
                    const { details, ...rest } = step;
                    return rest;
                });
            }
        } else {
            // 添加默认步骤
            processedRecipe.steps = [
                { text: '准备所有食材', image: '' }
            ];
        }

        // 处理预处理步骤
        if (recipe.preparations && Array.isArray(recipe.preparations)) {
            processedRecipe.preparations = recipe.preparations;
        } else {
            // 添加默认预处理步骤
            processedRecipe.preparations = [
                { text: '清洗并切好所有食材', image: '' }
            ];
        }

        // 处理小贴士
        if (recipe.tips && Array.isArray(recipe.tips)) {
            processedRecipe.tips = recipe.tips;
        } else if (recipe.tip && typeof recipe.tip === 'string') {
            // 如果有单个tip字段，转换为数组
            processedRecipe.tips = [recipe.tip];
        } else {
            // 添加默认小贴士
            processedRecipe.tips = ['根据个人口味可以适当调整调料用量'];
        }

        return processedRecipe;
    },

    // 检查食材库存状态
    checkIngredientsStatus: function () {
        // 这里应该是从本地存储或服务器获取用户的食材库存数据
        // 然后与菜谱所需食材进行比对，更新食材状态
        // 示例代码，实际应用中需要替换为真实的API调用

        const recipe = this.data.recipe;
        if (!recipe) return;

        const missingIngredients = [];

        // 检查主料
        if (recipe.mainIngredients) {
            recipe.mainIngredients.forEach(item => {
                if (item.status === 'out-of-stock') {
                    missingIngredients.push(item);
                }
            });
        }

        // 检查辅料
        if (recipe.accessories) {
            recipe.accessories.forEach(item => {
                if (item.status === 'out-of-stock') {
                    missingIngredients.push(item);
                }
            });
        }

        // 检查调料
        if (recipe.seasonings) {
            recipe.seasonings.forEach(item => {
                if (item.status === 'out-of-stock') {
                    missingIngredients.push(item);
                }
            });
        }

        this.setData({
            missingIngredients: missingIngredients
        });
    },

    // 切换标签页
    switchTab: function (e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({
            currentTab: tab
        });
    },

    // 复制食材清单
    copyIngredients: function () {
        const recipe = this.data.recipe;
        let ingredientsList = '【' + recipe.name + '】食材清单\n';

        // 添加主料
        if (recipe.mainIngredients && recipe.mainIngredients.length > 0) {
            ingredientsList += '\n【主料】\n';
            recipe.mainIngredients.forEach(item => {
                ingredientsList += item.name + ' ' + item.amount + '\n';
            });
        }

        // 添加辅料
        if (recipe.accessories && recipe.accessories.length > 0) {
            ingredientsList += '\n【辅料】\n';
            recipe.accessories.forEach(item => {
                ingredientsList += item.name + ' ' + item.amount + '\n';
            });
        }

        // 添加调料
        if (recipe.seasonings && recipe.seasonings.length > 0) {
            ingredientsList += '\n【调料】\n';
            recipe.seasonings.forEach(item => {
                ingredientsList += item.name + ' ' + item.amount + '\n';
            });
        }

        wx.setClipboardData({
            data: ingredientsList,
            success: function () {
                wx.showToast({
                    title: '食材清单已复制',
                    icon: 'success'
                });
            }
        });
    },

    // 添加缺少的食材到购物清单
    addToCart: function (e) {
        const item = e.currentTarget.dataset.item;

        // 这里应该是将食材添加到用户的购物清单
        // 示例代码，实际应用中需要替换为真实的API调用
        console.log('添加到购物清单:', item);

        // 获取现有购物清单
        let shoppingList = wx.getStorageSync('shoppingList') || [];

        // 检查是否已存在
        const existingIndex = shoppingList.findIndex(i => i.name === item.name);
        if (existingIndex >= 0) {
            // 已存在，更新数量
            shoppingList[existingIndex].amount = item.amount;
        } else {
            // 不存在，添加新项
            shoppingList.push({
                name: item.name,
                amount: item.amount,
                addTime: new Date().getTime()
            });
        }

        // 保存更新后的购物清单
        wx.setStorageSync('shoppingList', shoppingList);

        wx.showToast({
            title: '已添加到购物清单',
            icon: 'success'
        });
    },

    // 页面分享设置
    onShareAppMessage: function () {
        const recipe = this.data.recipe;
        if (!recipe) {
            return {
                title: '食光机菜谱',
                path: '/pages/index/index'
            };
        }

        return {
            title: recipe.name + ' - 食光机菜谱',
            path: '/pages/recipe-detail/recipe-detail?recipe=' + encodeURIComponent(JSON.stringify(recipe)),
            imageUrl: recipe.image
        };
    },

    // 格式化后端返回的菜谱详情数据为前端所需格式
    formatRecipeData: function (apiRecipe) {
        console.log('开始格式化API返回的菜谱数据:', apiRecipe);

        // 创建一个基础结构，确保所有必要的字段都存在
        const formattedRecipe = {
            id: apiRecipe.id || 0,
            name: apiRecipe.name || '未命名菜谱',
            image: apiRecipe.image || '/assets/recipes/default-recipe.svg',
            brief: apiRecipe.description || '一道美味又营养的家常菜，简单易做',
            cookTime: apiRecipe.cook_time || 30,
            difficulty: typeof apiRecipe.difficulty === 'number' ? this.getDifficultyText(apiRecipe.difficulty) : apiRecipe.difficulty || '简单',
            calories: apiRecipe.calories || '未知',

            // 处理食材数据
            mainIngredients: [],
            accessories: [],
            seasonings: [],

            // 处理工具数据
            tools: [],

            // 处理步骤数据
            preparations: [],
            steps: [],

            // 处理小贴士
            tips: []
        };

        // 处理食材列表
        if (apiRecipe.ingredients && Array.isArray(apiRecipe.ingredients)) {
            // 按照分类整理食材
            apiRecipe.ingredients.forEach(item => {
                // 处理库存状态
                let status = 'in-stock';
                let statusText = '库存充足';

                // 根据后端返回的stock_status字段设置状态
                if (item.stock_status === 'sufficient') {
                    status = 'in-stock';
                    statusText = '库存充足';
                } else if (item.stock_status === 'insufficient') {
                    status = 'low-stock';
                    statusText = '库存不足';
                } else if (item.stock_status === 'missing') {
                    status = 'out-of-stock';
                    statusText = '无库存';
                }

                const ingredient = {
                    name: item.name,
                    amount: `${item.quantity}${item.unit}`,
                    status: status,
                    statusText: statusText,
                    category: item.category
                };

                // 根据分类添加到不同列表
                if (item.category === '调味料') {
                    formattedRecipe.seasonings.push(ingredient);
                } else if (item.category === '辅料') {
                    formattedRecipe.accessories.push(ingredient);
                } else {
                    formattedRecipe.mainIngredients.push(ingredient);
                }
            });
        }

        // 处理工具列表
        if (apiRecipe.tools) {
            // 检查 tools 是否为包含emoji的对象数组
            if (Array.isArray(apiRecipe.tools) && typeof apiRecipe.tools[0] === 'object' && apiRecipe.tools[0].emoji) {
                formattedRecipe.tools = apiRecipe.tools.map(tool => {
                    return {
                        name: tool.name,
                        emoji: tool.emoji || '🍳',
                        alternative: tool.alternative || ''
                    };
                });
            }
            // 如果是字符串数组
            else if (Array.isArray(apiRecipe.tools) && typeof apiRecipe.tools[0] === 'string') {
                formattedRecipe.tools = apiRecipe.tools.map(toolName => {
                    return {
                        name: toolName,
                        emoji: '🍳', // 默认emoji
                        alternative: ''
                    };
                });
            }
            // 如果是对象数组但没有emoji
            else if (Array.isArray(apiRecipe.tools) && typeof apiRecipe.tools[0] === 'object') {
                formattedRecipe.tools = apiRecipe.tools.map(tool => {
                    return {
                        name: tool.name,
                        emoji: tool.emoji || '🍳', // 如果没有emoji使用默认
                        alternative: tool.alternative || ''
                    };
                });
            }
            console.log('处理后的工具列表:', formattedRecipe.tools);
        }

        // 处理预处理步骤
        if (apiRecipe.prep_steps) {
            // 如果是字符串数组
            if (Array.isArray(apiRecipe.prep_steps) && typeof apiRecipe.prep_steps[0] === 'string') {
                formattedRecipe.preparations = apiRecipe.prep_steps.map((step, index) => {
                    return {
                        text: step,
                        image: ''
                    };
                });
            }
            // 如果是对象数组
            else if (Array.isArray(apiRecipe.prep_steps) && typeof apiRecipe.prep_steps[0] === 'object') {
                formattedRecipe.preparations = apiRecipe.prep_steps.map(step => {
                    return {
                        text: step.desc || step.content || step.text || '',
                        image: step.image || ''
                    };
                });
            }
            console.log('处理后的预处理步骤:', formattedRecipe.preparations);
        }

        // 处理烹饪步骤
        if (apiRecipe.steps && Array.isArray(apiRecipe.steps)) {
            console.log('处理烹饪步骤:', apiRecipe.steps);
            // 如果是字符串数组
            if (typeof apiRecipe.steps[0] === 'string') {
                formattedRecipe.steps = apiRecipe.steps.map((step, index) => {
                    return {
                        text: step,
                        image: ''
                    };
                });
            }
            // 如果是对象数组
            else {
                formattedRecipe.steps = apiRecipe.steps.map(step => {
                    return {
                        text: step.desc || step.content || step.text || '',
                        image: step.image || ''
                    };
                });
            }
        }

        // 处理小贴士
        if (apiRecipe.tips) {
            // 如果tips是JSON字符串，先解析
            if (typeof apiRecipe.tips === 'string' && apiRecipe.tips.startsWith('[') && apiRecipe.tips.endsWith(']')) {
                try {
                    const parsedTips = JSON.parse(apiRecipe.tips);
                    if (Array.isArray(parsedTips)) {
                        formattedRecipe.tips = parsedTips;
                    } else {
                        formattedRecipe.tips = [apiRecipe.tips];
                    }
                } catch (e) {
                    console.error('解析tips字符串失败:', e);
                    // 退化处理：按换行符分割字符串
                    formattedRecipe.tips = apiRecipe.tips.split('\n').filter(tip => tip.trim() !== '');
                }
            }
            // 如果tips是普通字符串，按换行符分割
            else if (typeof apiRecipe.tips === 'string') {
                formattedRecipe.tips = apiRecipe.tips.split('\n').filter(tip => tip.trim() !== '');
            }
            // 如果已经是数组
            else if (Array.isArray(apiRecipe.tips)) {
                formattedRecipe.tips = apiRecipe.tips;
            }
        } else {
            // 设置默认小贴士
            formattedRecipe.tips = ['根据个人口味可以适当调整调料用量'];
        }

        // 处理标签（如果有）
        if (apiRecipe.tags && Array.isArray(apiRecipe.tags)) {
            formattedRecipe.tags = apiRecipe.tags;
        }

        console.log('格式化后的菜谱数据:', formattedRecipe);
        return formattedRecipe;
    },

    // 将难度等级数字转换为文本表示
    getDifficultyText: function (difficultyLevel) {
        const difficultyTexts = {
            1: '非常简单',
            2: '简单',
            3: '中等',
            4: '较难',
            5: '困难'
        };

        return difficultyTexts[difficultyLevel] || '中等';
    },

    // 返回上一页
    goBack: function () {
        wx.navigateBack({
            fail: function () {
                // 如果返回失败，则跳转到首页
                wx.switchTab({
                    url: '/pages/index/index'
                });
            }
        });
    }
})
