// restrictions.js
Page({
    data: {
        memberId: '', // 当前成员ID
        memberName: '', // 当前成员名称
        activeTab: 'allergies', // 默认标签：过敏源

        // 预设的过敏源列表
        predefinedAllergies: [
            { id: 'shellfish', name: '贝类', icon: '🦞', description: '如龙虾、蟹、虾等' },
            { id: 'dairy', name: '乳制品', icon: '🥛', description: '如牛奶、奶酪、酸奶等' },
            { id: 'nuts', name: '坚果', icon: '🥜', description: '如花生、杏仁、核桃等' },
            { id: 'eggs', name: '鸡蛋', icon: '🥚', description: '包括蛋黄和蛋白' },
            { id: 'wheat', name: '小麦', icon: '🌾', description: '含麸质食品，如面包、面条等' },
            { id: 'soy', name: '大豆', icon: '🫘', description: '如豆腐、豆浆等豆制品' },
            { id: 'fish', name: '鱼类', icon: '🐟', description: '各种鱼类食品' },
            { id: 'fruit', name: '水果', icon: '🍎', description: '特定水果，如草莓、柑橘等' }
        ],

        // 预设的宗教饮食禁忌
        predefinedReligious: [
            { id: 'pork', name: '不吃猪肉', icon: '🐷', description: '伊斯兰教、犹太教等' },
            { id: 'beef', name: '不吃牛肉', icon: '🐮', description: '印度教等' },
            { id: 'allMeat', name: '全素食', icon: '🥦', description: '纯素食主义者' },
            { id: 'seafood', name: '不吃海鲜', icon: '🦑', description: '特定教派要求' },
            { id: 'alcohol', name: '不含酒精', icon: '🍷', description: '伊斯兰教等' }
        ],

        // 用户选择的过敏源
        selectedAllergies: [],

        // 用户选择的宗教饮食禁忌
        selectedReligious: [],

        // 自定义禁忌列表
        customRestrictions: [],

        showAddModal: false, // 控制添加自定义禁忌的弹窗
        newRestriction: {     // 新添加的自定义禁忌
            name: '',
            description: '',
            type: 'allergies' // 默认类型为过敏源
        },

        hasChanges: false // 跟踪用户是否做了改动
    },

    onLoad: function (options) {
        if (options.memberId) {
            // 获取成员ID，可能从家庭模式传递过来
            this.setData({
                memberId: options.memberId
            });

            // 获取成员名称
            this.getMemberName();
        }

        // 加载用户的饮食禁忌设置
        this.loadRestrictions();

        // 监听返回事件
        wx.onBackPress(this.handleBackPress.bind(this));
    },

    onUnload: function () {
        // 页面卸载时移除返回事件监听
        wx.offBackPress();
    },

    // 处理返回按钮事件，如有未保存的更改，提示用户
    handleBackPress: function () {
        if (this.data.hasChanges) {
            wx.showModal({
                title: '提示',
                content: '您有未保存的更改，确定要离开吗？',
                success: (res) => {
                    if (res.confirm) {
                        // 用户确认离开，不做处理让系统执行返回
                        return false;
                    } else {
                        // 用户取消离开，阻止默认返回行为
                        return true;
                    }
                }
            });
            return true; // 阻止默认返回行为，等待modal交互结果
        }
        return false; // 无更改，使用默认返回行为
    },

    // 获取成员名称
    getMemberName: function () {
        // 从本地存储获取家庭成员信息
        const familyMembers = wx.getStorageSync('familyMembers') || [];
        const currentMember = familyMembers.find(m => m.id === this.data.memberId);

        // 如果找到匹配的成员，设置成员名称，否则设置为默认值
        this.setData({
            memberName: currentMember ? currentMember.name : '自己'
        });

        console.log('当前成员：', this.data.memberName);
    },

    // 加载用户的饮食禁忌设置
    loadRestrictions: function () {
        const memberId = this.data.memberId || 'self';
        const storageKey = `restrictions_${memberId}`;

        const savedRestrictions = wx.getStorageSync(storageKey) || {};

        this.setData({
            selectedAllergies: savedRestrictions.allergies || [],
            selectedReligious: savedRestrictions.religious || [],
            customRestrictions: savedRestrictions.custom || []
        });

        // 初始加载不算变更
        this.setData({ hasChanges: false });
    },

    // 切换标签
    switchTab: function (e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({
            activeTab: tab
        });
    },

    // 切换过敏源选择状态
    toggleAllergy: function (e) {
        const id = e.currentTarget.dataset.id;
        let selectedAllergies = [...this.data.selectedAllergies];

        const index = selectedAllergies.findIndex(item => item === id);
        if (index > -1) {
            // 如果已选择，则取消选择
            selectedAllergies.splice(index, 1);
        } else {
            // 如果未选择，则添加选择
            selectedAllergies.push(id);
        }

        this.setData({
            selectedAllergies: selectedAllergies,
            hasChanges: true
        });
    },

    // 切换宗教禁忌选择状态
    toggleReligious: function (e) {
        const id = e.currentTarget.dataset.id;
        let selectedReligious = [...this.data.selectedReligious];

        const index = selectedReligious.findIndex(item => item === id);
        if (index > -1) {
            // 如果已选择，则取消选择
            selectedReligious.splice(index, 1);
        } else {
            // 如果未选择，则添加选择
            selectedReligious.push(id);
        }

        this.setData({
            selectedReligious: selectedReligious,
            hasChanges: true
        });
    },

    // 显示添加自定义禁忌弹窗
    showAddCustom: function () {
        this.setData({
            showAddModal: true,
            newRestriction: {
                name: '',
                description: '',
                type: this.data.activeTab === 'custom' ? 'allergies' : this.data.activeTab
            }
        });
    },

    // 关闭添加自定义禁忌弹窗
    closeAddModal: function () {
        this.setData({
            showAddModal: false
        });
    },

    // 输入框内容变化处理
    onInputChange: function (e) {
        const field = e.currentTarget.dataset.field;
        const value = e.detail.value;

        let newRestriction = this.data.newRestriction;
        newRestriction[field] = value;

        this.setData({
            newRestriction: newRestriction
        });
    },

    // 切换自定义禁忌类型
    onTypeChange: function (e) {
        const type = e.detail.value;
        let newRestriction = this.data.newRestriction;
        newRestriction.type = type;

        this.setData({
            newRestriction: newRestriction
        });
    },

    // 添加自定义禁忌
    addCustomRestriction: function () {
        const { name, description, type } = this.data.newRestriction;

        if (!name) {
            wx.showToast({
                title: '请输入禁忌名称',
                icon: 'none'
            });
            return;
        }

        // 检查是否重复
        const isDuplicate = this.data.customRestrictions.some(item =>
            item.name === name && item.type === type);

        if (isDuplicate) {
            wx.showToast({
                title: '已存在相同的禁忌项',
                icon: 'none'
            });
            return;
        }

        const newItem = {
            id: `custom_${Date.now()}`,
            name: name,
            description: description || '',
            type: type,
            icon: type === 'allergies' ? '⚠️' : '🚫',
            isCustom: true
        };

        let customRestrictions = [...this.data.customRestrictions, newItem];

        this.setData({
            customRestrictions: customRestrictions,
            showAddModal: false,
            hasChanges: true
        });

        wx.showToast({
            title: '添加成功',
            icon: 'success'
        });

        // 如果当前不在自定义标签页，提示用户
        if (this.data.activeTab !== 'custom') {
            setTimeout(() => {
                wx.showToast({
                    title: '已添加到自定义列表',
                    icon: 'none',
                    duration: 2000
                });
            }, 1500);
        }
    },

    // 删除自定义禁忌
    deleteCustom: function (e) {
        const id = e.currentTarget.dataset.id;

        wx.showModal({
            title: '确认删除',
            content: '确定要删除这项禁忌吗？',
            success: res => {
                if (res.confirm) {
                    const customRestrictions = this.data.customRestrictions.filter(item => item.id !== id);

                    this.setData({
                        customRestrictions: customRestrictions,
                        hasChanges: true
                    });

                    wx.showToast({
                        title: '已删除',
                        icon: 'success'
                    });
                }
            }
        });
    },

    // 保存所有设置
    saveRestrictions: function () {
        const memberId = this.data.memberId || 'self';
        const storageKey = `restrictions_${memberId}`;

        const restrictions = {
            allergies: this.data.selectedAllergies,
            religious: this.data.selectedReligious,
            custom: this.data.customRestrictions
        };

        wx.setStorageSync(storageKey, restrictions);

        // 重置变更状态
        this.setData({
            hasChanges: false
        });

        // 显示保存成功提示，带有加载效果
        wx.showLoading({
            title: '正在保存...',
            mask: true
        });

        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
                title: '设置已保存',
                icon: 'success',
                duration: 2000
            });

            // 延迟返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }, 800);
    }
}) 