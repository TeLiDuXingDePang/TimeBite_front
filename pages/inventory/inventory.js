// inventory.js
const api = require('../../utils/api');
const router = require('../../utils/router');

Page({
    data: {
        currentTab: 'all', // 默认选中全部标签
        totalItems: 0,
        freshItems: 0,
        expiringItems: 0,
        expiredItems: 0,
        isLoading: true, // 添加加载状态
        loadError: false, // 添加错误状态
        // 编辑弹窗相关数据
        showEditModal: false, // 是否显示编辑弹窗
        editingItem: null, // 当前正在编辑的食材
        currentDate: '', // 当前日期，用于日期选择器
        categories: [
            {
                id: 'fresh',
                name: '新鲜食材',
                icon: '/assets/icons/fresh.svg',
                items: []
            },
            {
                id: 'expiring',
                name: '临期食材',
                icon: '/assets/icons/expiring.svg',
                items: []
            },
            {
                id: 'expired',
                name: '过期食材',
                icon: '/assets/icons/expired.svg',
                items: []
            }
        ]
    },

    onLoad: function () {
        // 首先确保用户已登录
        const app = getApp();
        app.checkLoginStatus();

        // 检查登录状态，未登录则跳转到登录页
        if (!router.checkLogin()) {
            return;
        }

        // 设置当前日期(YYYY-MM-DD格式)
        this.setCurrentDate();

        // 从后端获取食材数据
        this.fetchAllIngredients();
    },

    // 设置当前日期
    setCurrentDate: function () {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        this.setData({
            currentDate: `${year}-${month}-${day}`
        });
    },

    onShow: function () {
        // 重新检查登录状态
        const app = getApp();
        app.checkLoginStatus();

        // 每次显示页面时刷新数据
        this.fetchAllIngredients();
    },

    // 从后端获取所有食材数据
    fetchAllIngredients: function () {
        // 先确保之前的loading已关闭
        wx.hideLoading();

        // 设置加载状态
        this.setData({
            isLoading: true,
            loadError: false
        });

        // 调用API获取所有食材
        api.getAllIngredients()
            .then(res => {
                console.log('成功获取食材库存列表:', res);

                if (res.code === 200 && res.data && res.data.ingredients) {
                    // 处理食材数据，分类为新鲜、临期和过期
                    this.processIngredientsData(res.data.ingredients);
                } else if (res.code === 404) {
                    // 没有找到任何食材
                    console.log('没有找到任何食材');
                    // 清空所有分类的食材
                    this.clearAllIngredients();
                    // 更新统计数据
                    this.calculateStats();
                    // 更新加载状态
                    this.setData({
                        isLoading: false
                    });
                } else {
                    console.error('获取食材库存列表数据格式异常:', res);
                    this.setData({
                        loadError: true,
                        isLoading: false
                    });

                    // 显示错误提示
                    wx.showToast({
                        title: '获取食材列表失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            })
            .catch(err => {
                console.error('获取食材库存列表失败:', err);
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

    // 处理食材数据，分类为新鲜、临期和过期
    processIngredientsData: function (ingredients) {
        // 创建三个分类的食材数组
        const freshItems = [];
        const expiringItems = [];
        const expiredItems = [];

        // 临期天数阈值（5天内为临期）
        const expiringThreshold = 3;

        // 遍历所有食材，进行分类
        ingredients.forEach(item => {
            // 构建食材对象
            const ingredient = {
                id: item.id,
                name: item.name,
                quantity: `${item.quantity}${item.unit}`,
                expireDate: item.expiry_date || '未设置'
            };

            // 根据过期天数进行分类
            if (!item.expiry_date) {
                // 没有设置过期日期的食材，视为新鲜
                freshItems.push(ingredient);
            } else if (item.days_until_expiry === 0) {
                // 已过期的食材
                expiredItems.push({
                    ...ingredient,
                    daysLeft: 0
                });
            } else if (item.days_until_expiry <= expiringThreshold) {
                // 临期食材（3天内过期）
                expiringItems.push({
                    ...ingredient,
                    daysLeft: item.days_until_expiry
                });
            } else {
                // 新鲜食材
                freshItems.push({
                    ...ingredient,
                    daysLeft: item.days_until_expiry
                });
            }
        });

        // 更新数据
        const categories = this.data.categories;
        categories[0].items = freshItems;
        categories[1].items = expiringItems;
        categories[2].items = expiredItems;

        this.setData({
            categories: categories,
            isLoading: false
        });

        // 计算统计数据
        this.calculateStats();
    },

    // 清空所有分类的食材
    clearAllIngredients: function () {
        const categories = this.data.categories;
        categories.forEach(category => {
            category.items = [];
        });

        this.setData({
            categories: categories
        });
    },

    // 计算食材统计数据
    calculateStats: function () {
        let freshCount = this.data.categories[0].items.length;
        let expiringCount = this.data.categories[1].items.length;
        let expiredCount = this.data.categories[2].items.length;
        let totalCount = freshCount + expiringCount + expiredCount;

        this.setData({
            totalItems: totalCount,
            freshItems: freshCount,
            expiringItems: expiringCount,
            expiredItems: expiredCount
        });
    },

    switchTab: function (e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({
            currentTab: tab
        });
    },

    // 打开编辑弹窗
    editItem: function (e) {
        const itemId = e.currentTarget.dataset.id;
        console.log('编辑食材:', itemId);

        // 查找要编辑的食材
        let targetItem = null;

        // 遍历所有分类查找对应ID的食材
        for (const category of this.data.categories) {
            const found = category.items.find(item => item.id === itemId);
            if (found) {
                targetItem = found;
                break;
            }
        }

        if (targetItem) {
            // 将数量从"500克"格式转为纯数字
            let quantity = '';
            if (targetItem.quantity) {
                // 移除数量中的单位部分，只保留数字
                quantity = targetItem.quantity.replace(/[^0-9.]/g, '');
            }

            // 设置编辑项并显示弹窗
            this.setData({
                editingItem: {
                    id: targetItem.id,
                    name: targetItem.name,
                    quantity: quantity,
                    expireDate: targetItem.expireDate === '未设置' ? '' : targetItem.expireDate,
                    originalQuantity: targetItem.quantity,
                    originalExpireDate: targetItem.expireDate
                },
                showEditModal: true
            });
        } else {
            wx.showToast({
                title: '未找到该食材',
                icon: 'none',
                duration: 2000
            });
        }
    },

    // 取消编辑
    cancelEdit: function () {
        this.setData({
            showEditModal: false,
            editingItem: null
        });
    },

    // 更新数量输入
    onQuantityInput: function (e) {
        this.setData({
            'editingItem.quantity': e.detail.value
        });
    },

    // 更新日期选择
    onDateChange: function (e) {
        this.setData({
            'editingItem.expireDate': e.detail.value
        });
    },

    // 保存编辑
    saveEdit: function () {
        const item = this.data.editingItem;

        // 验证输入
        if (item.quantity && (isNaN(item.quantity) || Number(item.quantity) <= 0)) {
            wx.showToast({
                title: '请输入有效的数量',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 准备更新参数
        const updateData = {};

        // 只有当数量有变化时才加入更新数据
        if (item.quantity) {
            updateData.quantity = Number(item.quantity);
        }

        // 只有当过期日期有变化时才加入更新数据
        if (item.expireDate) {
            updateData.expiry_date = item.expireDate;
        }

        // 如果没有要更新的数据，则提示用户
        if (Object.keys(updateData).length === 0) {
            wx.showToast({
                title: '没有发现修改',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 先关闭弹窗，避免重复操作
        this.setData({
            showEditModal: false
        });

        // 显示加载提示
        wx.showLoading({
            title: '保存中...',
            mask: true
        });

        // 调用API更新食材信息
        api.updateIngredient(item.id, updateData)
            .then(res => {
                // 确保隐藏加载提示
                wx.hideLoading();

                if (res.code === 200) {
                    console.log('食材更新成功:', res);

                    // 显示成功提示
                    wx.showToast({
                        title: '更新成功',
                        icon: 'success',
                        duration: 1500
                    });

                    // 完全清除编辑项
                    this.setData({
                        editingItem: null
                    });

                    // 成功后添加短暂延迟再刷新，避免加载状态冲突
                    setTimeout(() => {
                        this.fetchAllIngredients();
                    }, 100);
                } else if (res.code === 400) {
                    console.error('更新食材参数错误:', res);

                    // 显示具体的参数错误提示
                    wx.showToast({
                        title: res.message || '参数错误',
                        icon: 'none',
                        duration: 2000
                    });
                } else if (res.code === 404) {
                    console.error('未找到要更新的食材:', res);

                    // 显示未找到的提示
                    wx.showToast({
                        title: '食材不存在或已被删除',
                        icon: 'none',
                        duration: 2000
                    });

                    // 由于食材可能已被删除，刷新列表
                    this.setData({
                        editingItem: null
                    });

                    // 添加短暂延迟再刷新
                    setTimeout(() => {
                        this.fetchAllIngredients();
                    }, 100);
                } else if (res.code === 500) {
                    console.error('服务器处理更新请求时出错:', res);

                    // 显示服务器错误提示
                    wx.showToast({
                        title: '服务器错误，请稍后再试',
                        icon: 'none',
                        duration: 2000
                    });
                } else {
                    console.error('更新食材返回未知错误:', res);

                    // 显示通用错误提示
                    wx.showToast({
                        title: res.message || '更新失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            })
            .catch(err => {
                // 确保隐藏加载提示
                wx.hideLoading();
                console.error('更新食材失败:', err);

                // 处理网络错误
                let errorMsg = '网络错误，请检查网络连接';
                if (err.errMsg && err.errMsg.includes('timeout')) {
                    errorMsg = '请求超时，请稍后再试';
                } else if (err.message) {
                    // 如果有具体的错误消息，优先显示
                    errorMsg = err.message;
                }

                // 显示错误提示
                wx.showToast({
                    title: errorMsg,
                    icon: 'none',
                    duration: 2000
                });
            })
            .finally(() => {
                // 确保在任何情况下都关闭loading
                wx.hideLoading();

                // 确保编辑项被清除
                if (this.data.editingItem) {
                    this.setData({
                        editingItem: null
                    });
                }
            });
    },

    // 删除食材
    deleteItem: function (e) {
        const itemId = e.currentTarget.dataset.id;
        console.log('删除食材:', itemId);

        // 显示确认对话框
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这个食材吗？',
            success: (res) => {
                if (res.confirm) {
                    // 用户点击了确认，调用删除API
                    wx.showLoading({
                        title: '删除中...',
                        mask: true
                    });

                    api.deleteIngredient(itemId)
                        .then(res => {
                            wx.hideLoading();

                            if (res.code === 200) {
                                console.log('食材删除成功:', res);

                                // 显示成功提示
                                wx.showToast({
                                    title: '删除成功',
                                    icon: 'success',
                                    duration: 1500
                                });

                                // 删除后刷新列表
                                setTimeout(() => {
                                    this.fetchAllIngredients();
                                }, 100);
                            } else if (res.code === 404) {
                                console.error('未找到要删除的食材:', res);

                                // 显示未找到的提示
                                wx.showToast({
                                    title: '食材不存在或已被删除',
                                    icon: 'none',
                                    duration: 2000
                                });

                                // 刷新列表，确保数据是最新的
                                setTimeout(() => {
                                    this.fetchAllIngredients();
                                }, 100);
                            } else if (res.code === 500) {
                                console.error('服务器处理删除请求时出错:', res);

                                // 显示服务器错误提示
                                wx.showToast({
                                    title: '服务器错误，请稍后再试',
                                    icon: 'none',
                                    duration: 2000
                                });
                            } else {
                                console.error('删除食材返回未知错误:', res);

                                // 显示通用错误提示
                                wx.showToast({
                                    title: res.message || '删除失败',
                                    icon: 'none',
                                    duration: 2000
                                });
                            }
                        })
                        .catch(error => {
                            console.error('删除食材请求失败:', error);

                            // 关闭加载提示
                            wx.hideLoading();

                            // 处理网络错误
                            let errorMsg = '网络错误，请检查网络连接';
                            if (error.errMsg && error.errMsg.includes('timeout')) {
                                errorMsg = '请求超时，请稍后再试';
                            }

                            // 显示错误提示
                            wx.showToast({
                                title: errorMsg,
                                icon: 'none',
                                duration: 2000
                            });
                        })
                        .finally(() => {
                            // 确保在任何情况下都关闭loading
                            wx.hideLoading();
                        });
                }
            }
        });
    },

    // 添加新食材
    addNewItem: function () {
        console.log('添加新食材');
        // 导航到添加食材页面
        wx.navigateTo({
            url: '/pages/ingredient-add/ingredient-add'
        });
    }
});