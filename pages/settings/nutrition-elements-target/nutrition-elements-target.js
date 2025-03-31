// nutrition-elements-target.js
Page({
    data: {
        activeTab: 'macro', // 默认选中三大营养素标签
        showEditModal: false, // 控制编辑弹窗
        currentEdit: {}, // 当前编辑的元素

        // 三大营养素配置项
        macroItems: [
            {
                key: 'protein',
                name: '蛋白质',
                desc: '促进肌肉生长和修复',
                color: '#4CAF50'
            },
            {
                key: 'fat',
                name: '脂肪',
                desc: '提供能量和帮助维生素吸收',
                color: '#FF9800'
            },
            {
                key: 'carbs',
                name: '碳水化合物',
                desc: '提供能量和支持大脑功能',
                color: '#2196F3'
            },
            {
                key: 'fiber',
                name: '膳食纤维',
                desc: '帮助消化和维持肠道健康',
                color: '#795548'
            }
        ],

        // 三大营养素目标设置
        macroTargets: {
            protein: {
                value: 60,
                unit: 'g',
                min: 20,
                max: 150,
                step: 1,
                recommended: 60
            },
            fat: {
                value: 50,
                unit: 'g',
                min: 20,
                max: 120,
                step: 1,
                recommended: 50
            },
            carbs: {
                value: 250,
                unit: 'g',
                min: 100,
                max: 400,
                step: 5,
                recommended: 250
            },
            fiber: {
                value: 25,
                unit: 'g',
                min: 10,
                max: 40,
                step: 1,
                recommended: 25
            }
        },

        // 维生素目标设置
        vitaminTargets: [
            {
                id: 'vitA',
                name: '维生素A',
                value: 800,
                unit: 'μg',
                min: 400,
                max: 1500,
                step: 50,
                recommended: 800,
                status: 'recommended',
                statusText: '推荐',
                description: '维持正常视力、免疫功能和细胞生长',
                foodSources: '胡萝卜、南瓜、菠菜、甜椒、鱼肝油'
            },
            {
                id: 'vitC',
                name: '维生素C',
                value: 100,
                unit: 'mg',
                min: 50,
                max: 1000,
                step: 10,
                recommended: 100,
                status: 'recommended',
                statusText: '推荐',
                description: '抗氧化剂，促进铁吸收，增强免疫力',
                foodSources: '柑橘类水果、番茄、青椒、草莓、猕猴桃'
            },
            {
                id: 'vitD',
                name: '维生素D',
                value: 10,
                unit: 'μg',
                min: 5,
                max: 25,
                step: 1,
                recommended: 10,
                status: 'recommended',
                statusText: '推荐',
                description: '促进钙吸收，维持骨骼健康',
                foodSources: '阳光照射、鱼肝油、蛋黄、强化乳制品'
            },
            {
                id: 'vitE',
                name: '维生素E',
                value: 14,
                unit: 'mg',
                min: 7,
                max: 30,
                step: 1,
                recommended: 14,
                status: 'recommended',
                statusText: '推荐',
                description: '抗氧化剂，保护细胞免受损伤',
                foodSources: '坚果、种子、植物油、绿叶蔬菜'
            },
            {
                id: 'vitB1',
                name: '维生素B1',
                value: 1.2,
                unit: 'mg',
                min: 0.5,
                max: 3,
                step: 0.1,
                recommended: 1.2,
                status: 'recommended',
                statusText: '推荐',
                description: '碳水化合物代谢，支持神经系统功能',
                foodSources: '全谷类、豆类、瘦肉、坚果'
            },
            {
                id: 'vitB2',
                name: '维生素B2',
                value: 1.3,
                unit: 'mg',
                min: 0.5,
                max: 3,
                step: 0.1,
                recommended: 1.3,
                status: 'recommended',
                statusText: '推荐',
                description: '能量代谢，支持红血球功能',
                foodSources: '奶制品、鸡蛋、绿叶蔬菜、肉类'
            }
        ],

        // 矿物质目标设置
        mineralTargets: [
            {
                id: 'calcium',
                name: '钙',
                value: 800,
                unit: 'mg',
                min: 400,
                max: 1500,
                step: 50,
                recommended: 800,
                status: 'recommended',
                statusText: '推荐',
                description: '骨骼和牙齿健康，心肌收缩，神经传导',
                foodSources: '奶制品、豆腐、绿叶蔬菜、杏仁'
            },
            {
                id: 'iron',
                name: '铁',
                value: 18,
                unit: 'mg',
                min: 8,
                max: 30,
                step: 1,
                recommended: 18,
                status: 'recommended',
                statusText: '推荐',
                description: '运输氧气，支持免疫功能',
                foodSources: '红肉、豆类、菠菜、强化谷物'
            },
            {
                id: 'zinc',
                name: '锌',
                value: 11,
                unit: 'mg',
                min: 5,
                max: 20,
                step: 1,
                recommended: 11,
                status: 'recommended',
                statusText: '推荐',
                description: '免疫功能，蛋白质合成，细胞分裂',
                foodSources: '牛肉、贝类、豆类、坚果、种子'
            },
            {
                id: 'potassium',
                name: '钾',
                value: 3500,
                unit: 'mg',
                min: 2000,
                max: 5000,
                step: 100,
                recommended: 3500,
                status: 'recommended',
                statusText: '推荐',
                description: '肌肉功能，神经传导，血压调节',
                foodSources: '香蕉、橙子、土豆、菠菜、豆类'
            }
        ]
    },

    onLoad: function () {
        // 从存储中加载用户的营养目标设置
        this.loadNutritionTargets();
    },

    // 加载所有营养目标设置
    loadNutritionTargets: function () {
        // 三大营养素
        const savedMacroTargets = wx.getStorageSync('macroTargets');
        if (savedMacroTargets) {
            this.setData({
                macroTargets: savedMacroTargets
            });
        }

        // 维生素
        const savedVitamins = wx.getStorageSync('vitaminTargets');
        if (savedVitamins) {
            this.setData({
                vitaminTargets: savedVitamins
            });
        }

        // 矿物质
        const savedMinerals = wx.getStorageSync('mineralTargets');
        if (savedMinerals) {
            this.setData({
                mineralTargets: savedMinerals
            });
        }
    },

    // 切换标签页
    switchTab: function (e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({
            activeTab: tab
        });
    },

    // 通用营养元素滑块变化处理
    onMacroChange: function (e) {
        const value = e.detail.value;
        const type = e.currentTarget.dataset.type;
        const macroTargets = this.data.macroTargets;
        macroTargets[type].value = value;
        this.setData({
            macroTargets: macroTargets
        });
    },

    // 编辑维生素目标
    editVitaminTarget: function (e) {
        const id = e.currentTarget.dataset.id;
        const vitamin = this.data.vitaminTargets.find(item => item.id === id);

        this.setData({
            currentEdit: vitamin,
            showEditModal: true
        });
    },

    // 编辑矿物质目标
    editMineralTarget: function (e) {
        const id = e.currentTarget.dataset.id;
        const mineral = this.data.mineralTargets.find(item => item.id === id);

        this.setData({
            currentEdit: mineral,
            showEditModal: true
        });
    },

    // 取消编辑
    cancelEdit: function () {
        this.setData({
            showEditModal: false
        });
    },

    // 阻止事件冒泡
    stopPropagation: function () {
        // 仅阻止事件冒泡
    },

    // 元素值变化处理
    onElementValueChange: function (e) {
        const value = e.detail.value;
        let currentEdit = this.data.currentEdit;
        currentEdit.value = value;

        // 设置状态
        if (value < currentEdit.recommended * 0.8) {
            currentEdit.status = 'low';
            currentEdit.statusText = '过低';
        } else if (value > currentEdit.recommended * 1.2) {
            currentEdit.status = 'high';
            currentEdit.statusText = '过高';
        } else {
            currentEdit.status = 'recommended';
            currentEdit.statusText = '推荐';
        }

        this.setData({
            currentEdit: currentEdit
        });
    },

    // 确认编辑
    confirmEdit: function () {
        const currentEdit = this.data.currentEdit;

        // 根据不同类型更新对应的数组
        if (currentEdit.id.startsWith('vit')) {
            // 更新维生素数组
            const vitaminTargets = this.data.vitaminTargets.map(item => {
                if (item.id === currentEdit.id) {
                    return currentEdit;
                }
                return item;
            });

            this.setData({
                vitaminTargets: vitaminTargets,
                showEditModal: false
            });
        } else {
            // 更新矿物质数组
            const mineralTargets = this.data.mineralTargets.map(item => {
                if (item.id === currentEdit.id) {
                    return currentEdit;
                }
                return item;
            });

            this.setData({
                mineralTargets: mineralTargets,
                showEditModal: false
            });
        }
    },

    // 恢复推荐值
    resetToRecommended: function () {
        wx.showModal({
            title: '恢复推荐值',
            content: '确定要将所有营养元素目标恢复到推荐值吗？',
            success: (res) => {
                if (res.confirm) {
                    // 将所有值重置为推荐值
                    const macroTargets = this.data.macroTargets;
                    const vitaminTargets = this.data.vitaminTargets;
                    const mineralTargets = this.data.mineralTargets;

                    // 三大营养素重置
                    for (let key in macroTargets) {
                        macroTargets[key].value = macroTargets[key].recommended;
                    }

                    // 维生素重置
                    for (let i = 0; i < vitaminTargets.length; i++) {
                        vitaminTargets[i].value = vitaminTargets[i].recommended;
                        vitaminTargets[i].status = 'recommended';
                        vitaminTargets[i].statusText = '推荐';
                    }

                    // 矿物质重置
                    for (let i = 0; i < mineralTargets.length; i++) {
                        mineralTargets[i].value = mineralTargets[i].recommended;
                        mineralTargets[i].status = 'recommended';
                        mineralTargets[i].statusText = '推荐';
                    }

                    this.setData({
                        macroTargets: macroTargets,
                        vitaminTargets: vitaminTargets,
                        mineralTargets: mineralTargets
                    });

                    wx.showToast({
                        title: '已恢复推荐值',
                        icon: 'success'
                    });
                }
            }
        });
    },

    // 保存所有设置
    saveNutritionTargets: function () {
        const { macroTargets, vitaminTargets, mineralTargets } = this.data;

        // 保存到本地存储
        wx.setStorageSync('macroTargets', macroTargets);
        wx.setStorageSync('vitaminTargets', vitaminTargets);
        wx.setStorageSync('mineralTargets', mineralTargets);

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