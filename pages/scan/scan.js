// scan.js
const api = require('../../utils/api');
const router = require('../../utils/router');

Page({
    data: {
        isCameraActive: false,
        showAddModal: false,
        recognizedFoods: [],
        recommendedRecipes: [],
        isAnalyzing: false,
        analyzeError: false,
        captureTempImage: '', // 存储临时图片路径
        unitOptions: ['个', '克', '千克', '根', '颗', '袋', '瓶', '盒'],
        newFood: {
            name: '',
            quantity: '',
            unitIndex: 0,
            expiryDays: 7,
            expiryDate: ''
        }
    },

    onLoad: function () {
        // 页面加载时的逻辑
        this.updateExpiryDate(this.data.newFood.expiryDays);

        // 首先确保用户已登录
        const app = getApp();
        app.checkLoginStatus();

        // 检查登录状态，未登录则跳转到登录页
        if (!router.checkLogin()) {
            return;
        }
    },

    // 相机控制
    toggleCamera: function () {
        const newStatus = !this.data.isCameraActive;
        this.setData({
            isCameraActive: newStatus,
            // 清空临时图片
            captureTempImage: newStatus ? '' : this.data.captureTempImage
        });

        if (newStatus) {
            wx.authorize({
                scope: 'scope.camera',
                success: () => {
                    console.log('相机权限获取成功');
                },
                fail: () => {
                    wx.showToast({
                        title: '需要相机权限',
                        icon: 'none'
                    });
                    this.setData({
                        isCameraActive: false
                    });
                }
            });
        }
    },

    cameraError: function (e) {
        console.error('相机错误', e.detail);
        wx.showToast({
            title: '相机启动失败',
            icon: 'none'
        });
        this.setData({
            isCameraActive: false
        });
    },

    // 清空识别结果
    clearAnalysisResults: function () {
        this.setData({
            recognizedFoods: [],
            recommendedRecipes: [],
            analyzeError: null
        });
    },

    takePhoto: function () {
        // 先清空旧的识别结果
        this.clearAnalysisResults();

        const camera = wx.createCameraContext();
        camera.takePhoto({
            quality: 'high',
            success: (res) => {
                // 保存临时图片路径
                this.setData({
                    captureTempImage: res.tempImagePath,
                    isCameraActive: false
                });

                // 调用API识别食材
                this.analyzeImage(res.tempImagePath);
            },
            fail: (err) => {
                console.error('拍照失败', err);
                wx.showToast({
                    title: '拍照失败',
                    icon: 'none'
                });
            }
        });
    },

    chooseImage: function () {
        // 先清空旧的识别结果
        this.clearAnalysisResults();

        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album'],
            success: (res) => {
                // 保存临时图片路径
                this.setData({
                    captureTempImage: res.tempFiles[0].tempFilePath,
                    isCameraActive: false
                });

                // 调用API识别食材
                this.analyzeImage(res.tempFiles[0].tempFilePath);
            },
            fail: (err) => {
                console.error('选择图片失败', err);
            }
        });
    },

    // 重新拍照
    retakePhoto: function () {
        this.setData({
            captureTempImage: '',
            isCameraActive: true,
            // 清空之前的识别结果
        });
        this.clearAnalysisResults();
    },

    // 分析图片
    analyzeImage(imagePath) {
        this.setData({
            isAnalyzing: true,
            analyzeError: null
        });

        // 调用后端API进行食材识别
        api.analyzeFoodImage(imagePath)
            .then(res => {
                console.log('食材识别成功:', res);

                if (res.ingredients && res.ingredients.length > 0) {
                    // 处理识别结果
                    const recognizedFoods = res.ingredients.map((item, index) => {
                        // 使用API返回的数量和单位
                        const quantity = item.quantity ? item.quantity.toString() : '1';
                        const unit = item.unit || '个';

                        // 查找单位在选项中的索引
                        const unitIndex = this.data.unitOptions.indexOf(unit) >= 0 ?
                            this.data.unitOptions.indexOf(unit) : 0;

                        // 使用API返回的保存天数，如果没有则默认7天
                        const expiryDays = item.storage_days || 7;

                        return {
                            id: Date.now() + index,
                            name: item.name,
                            quantity: quantity,
                            unitIndex: unitIndex,
                            unit: unit,
                            expiryDays: expiryDays,
                            expiryDate: this.calculateExpiryDate(expiryDays),
                            confidence: item.confidence || null,
                            emoji: item.emoji || '🍽️',
                            funFact: item.fun_fact || null,
                            healthNote: item.health_note || null,
                            tip: item.tip || null
                        };
                    });

                    // 生成菜谱推荐，优先使用后端返回的菜谱数据
                    let recommendedRecipes = [];
                    if (res.recipes && res.recipes.length > 0) {
                        // 使用后端返回的菜谱数据
                        recommendedRecipes = this.generateRecommendedRecipes(res);
                    } else {
                        // 如果后端没有返回菜谱数据，则尝试从摘要中提取
                        recommendedRecipes = this.generateRecommendedRecipes({ summary: res.summary || '', ingredients: recognizedFoods });
                    }

                    this.setData({
                        recognizedFoods: recognizedFoods,
                        recommendedRecipes: recommendedRecipes,
                        isAnalyzing: false
                    });

                    wx.showToast({
                        title: '识别成功',
                        icon: 'success',
                        duration: 2000
                    });
                } else if (res.raw_response) {
                    // 处理未能解析的结构化数据
                    this.setData({
                        analyzeError: '未能识别结构化食材数据，但获取到了分析结果',
                        isAnalyzing: false
                    });

                    // 显示原始响应
                    wx.showModal({
                        title: '识别结果',
                        content: res.raw_response.slice(0, 200) + '...',
                        showCancel: false
                    });

                } else {
                    this.setData({
                        analyzeError: '未能识别到任何食材，请确保图片清晰并包含食材。',
                        isAnalyzing: false
                    });
                }
            })
            .catch(err => {
                console.error('食材识别失败:', err);
                this.setData({
                    analyzeError: '食材识别失败，请重试。',
                    isAnalyzing: false
                });
            });
    },

    // 根据识别结果生成推荐菜谱
    generateRecommendedRecipes(data) {
        let recipes = [];

        // 优先使用后端返回的菜谱数据
        if (data.recipes && data.recipes.length > 0) {
            // 使用后端返回的菜谱推荐
            recipes = data.recipes.map((item, index) => {
                return {
                    id: `api-${index}`,
                    name: item.name,
                    image: '/assets/images/recipe-placeholder.jpg',
                    matchRate: parseInt(item.match_rate) || 90
                };
            });

            // 返回最多4个菜谱
            return recipes.slice(0, 4);
        }

        // 兼容旧版本：从摘要中提取可能的菜谱名称
        const summary = data.summary || '';
        const foods = data.ingredients || [];

        const recipeSuggestions = summary.match(/可制作(.*?)、(.*?)等/);
        if (recipeSuggestions && recipeSuggestions.length > 2) {
            // 添加从摘要中提取的菜谱建议
            recipes.push({
                id: 'suggest-1',
                name: recipeSuggestions[1].trim(),
                image: '/assets/images/recipe-placeholder.jpg',
                matchRate: 98
            });

            recipes.push({
                id: 'suggest-2',
                name: recipeSuggestions[2].trim(),
                image: '/assets/images/recipe-placeholder.jpg',
                matchRate: 85
            });
        } else {
            // 备用方案：如果没有匹配到菜谱建议格式
            const defaultRecipes = this.generateDefaultRecipes(foods);
            recipes = [...defaultRecipes];
        }

        return recipes;
    },

    // 生成默认菜谱推荐（当摘要解析失败时）
    generateDefaultRecipes(foods) {
        if (!foods || foods.length === 0) {
            return [];
        }

        const recipes = [];

        // 如果识别到鸡蛋和番茄，推荐番茄炒蛋
        const hasEgg = foods.some(food => food.name.includes('鸡蛋'));
        const hasTomato = foods.some(food => food.name.includes('番茄') || food.name.includes('西红柿'));

        if (hasEgg && hasTomato) {
            recipes.push({
                id: 'default-1',
                name: '番茄炒蛋',
                image: '/assets/images/recipe-placeholder.jpg',
                matchRate: 100
            });
        }

        // 如果有至少一种食材，推荐简单炒菜
        if (foods.length > 0) {
            const mainIngredient = foods[0].name;

            if (!recipes.some(r => r.name.includes(mainIngredient))) {
                recipes.push({
                    id: 'default-2',
                    name: `${mainIngredient}简易料理`,
                    image: '/assets/images/recipe-placeholder.jpg',
                    matchRate: 90
                });
            }
        }

        return recipes;
    },

    // 食材操作
    removeFood: function (e) {
        const foodId = e.currentTarget.dataset.id;
        const updatedFoods = this.data.recognizedFoods.filter(food => food.id !== foodId);

        this.setData({
            recognizedFoods: updatedFoods
        });

        // 如果没有食材了，清空推荐菜谱
        if (updatedFoods.length === 0) {
            this.setData({
                recommendedRecipes: []
            });
        }
    },

    updateQuantity: function (e) {
        const foodId = e.currentTarget.dataset.id;
        const newValue = e.detail.value;
        const updatedFoods = this.data.recognizedFoods.map(food => {
            if (food.id === foodId) {
                return { ...food, quantity: newValue };
            }
            return food;
        });

        this.setData({
            recognizedFoods: updatedFoods
        });
    },

    changeUnit: function (e) {
        const foodId = e.currentTarget.dataset.id;
        const unitIndex = parseInt(e.detail.value);
        const unit = this.data.unitOptions[unitIndex];

        const updatedFoods = this.data.recognizedFoods.map(food => {
            if (food.id === foodId) {
                return { ...food, unitIndex, unit };
            }
            return food;
        });

        this.setData({
            recognizedFoods: updatedFoods
        });
    },

    updateExpiry: function (e) {
        const foodId = e.currentTarget.dataset.id;
        const expiryDays = e.detail.value;
        const expiryDate = this.calculateExpiryDate(expiryDays);

        const updatedFoods = this.data.recognizedFoods.map(food => {
            if (food.id === foodId) {
                return { ...food, expiryDays, expiryDate };
            }
            return food;
        });

        this.setData({
            recognizedFoods: updatedFoods
        });
    },

    calculateExpiryDate: function (days) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(days));
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    // 手动添加食材
    showAddFoodModal: function () {
        // 重置新食材数据
        this.setData({
            showAddModal: true,
            newFood: {
                name: '',
                quantity: '',
                unitIndex: 0,
                expiryDays: 7,
                expiryDate: this.calculateExpiryDate(7)
            }
        });
    },

    hideAddFoodModal: function () {
        this.setData({
            showAddModal: false
        });
    },

    updateNewFood: function (e) {
        const field = e.currentTarget.dataset.field;
        const value = e.detail.value;
        const newFood = { ...this.data.newFood };

        newFood[field] = value;

        // 如果更新的是保质期天数，同时更新日期
        if (field === 'expiryDays') {
            newFood.expiryDate = this.calculateExpiryDate(value);
        }

        this.setData({
            newFood
        });
    },

    updateExpiryDate: function (days) {
        const expiryDate = this.calculateExpiryDate(days);
        this.setData({
            'newFood.expiryDate': expiryDate
        });
    },

    addNewFood: function () {
        // 验证输入
        if (!this.data.newFood.name.trim()) {
            wx.showToast({
                title: '请输入食材名称',
                icon: 'none'
            });
            return;
        }

        if (!this.data.newFood.quantity) {
            wx.showToast({
                title: '请输入数量',
                icon: 'none'
            });
            return;
        }

        // 获取所选单位
        const unit = this.data.unitOptions[this.data.newFood.unitIndex];

        // 创建新食材对象
        const newFood = {
            id: Date.now(),
            name: this.data.newFood.name,
            quantity: this.data.newFood.quantity,
            unitIndex: this.data.newFood.unitIndex,
            unit: unit,
            expiryDays: this.data.newFood.expiryDays,
            expiryDate: this.data.newFood.expiryDate,
            // 添加默认的其他属性，与API返回格式保持一致
            emoji: '🍽️',
            funFact: null,
            healthNote: null,
            tip: null
        };

        // 添加到列表
        const updatedFoods = [...this.data.recognizedFoods, newFood];

        this.setData({
            recognizedFoods: updatedFoods,
            showAddModal: false
        });

        // 如果这是第一个食材，添加一些默认推荐菜谱
        if (updatedFoods.length === 1) {
            this.setData({
                recommendedRecipes: [
                    {
                        id: 1,
                        name: '简易料理',
                        image: '/assets/recipes/recipe-default.svg',
                        matchRate: 70
                    }
                ]
            });
        }

        wx.showToast({
            title: '添加成功',
            icon: 'success'
        });
    },

    // 底部操作按钮
    viewRecipesOnly: function () {
        // 模拟跳转到菜谱页面
        wx.showToast({
            title: '查看菜谱功能开发中',
            icon: 'none'
        });
    },

    saveToInventory: function () {
        // 模拟保存到库存
        wx.showLoading({
            title: '保存中...',
        });

        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
                title: '已保存！推荐菜谱已更新',
                icon: 'success',
                duration: 2000
            });

            // 延迟返回首页
            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/index/index'
                });
            }, 2000);
        }, 1000);
    },

    // 查看菜谱
    viewRecipe(e) {
        const recipeId = e.currentTarget.dataset.id;

        // 对建议的菜谱ID进行处理
        if (recipeId.toString().startsWith('suggest-') || recipeId.toString().startsWith('default-') || recipeId.toString().startsWith('api-')) {
            // 获取菜谱名称显示
            const recipeName = this.data.recommendedRecipes.find(r => r.id === recipeId)?.name || '推荐菜谱';

            wx.showModal({
                title: '菜谱详情',
                content: `"${recipeName}" 详情页面正在开发中，敬请期待！`,
                showCancel: false,
                confirmText: '我知道了'
            });
            return;
        }

        // 跳转到菜谱详情页
        wx.navigateTo({
            url: `/pages/recipe-detail/recipe-detail?id=${recipeId}`
        });
    }
});
