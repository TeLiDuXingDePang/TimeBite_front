// family.js
Page({
    data: {
        // 家庭成员列表
        familyMembers: [
            {
                id: 'self',
                name: '我自己',
                avatar: '/assets/icons/myself-avatar.svg',
                role: '减脂模式',
                details: '每日小于1500kcal',
                isActive: true
            },
            {
                id: 'child',
                name: '孩子',
                avatar: '/assets/icons/child-avatar.svg',
                role: '儿童成长',
                details: '均衡营养摄入',
                isActive: false
            },
            {
                id: 'pregnant',
                name: '孕期',
                avatar: '/assets/icons/pregnant-avatar.svg',
                role: '孕妇营养',
                details: '富含叶酸和钙质',
                isActive: false
            },
            {
                id: 'elderly',
                name: '老人',
                avatar: '/assets/icons/elderly-avatar.svg',
                role: '老年健康',
                details: '低盐低脂饮食',
                isActive: false
            },
            {
                id: 'fitness',
                name: '健身',
                avatar: '/assets/icons/fitness-avatar.svg',
                role: '增肌塑形',
                details: '高蛋白饮食',
                isActive: false
            }
        ],
        showAddMemberModal: false
    },

    onLoad: function () {
        // 从本地存储加载家庭成员信息
        const savedMembers = wx.getStorageSync('familyMembers');
        if (savedMembers) {
            this.setData({
                familyMembers: savedMembers
            });
        }
    },

    // 切换成员
    switchMember: function (e) {
        const memberId = e.currentTarget.dataset.id;
        const members = this.data.familyMembers.map(item => {
            return {
                ...item,
                isActive: item.id === memberId
            };
        });

        this.setData({
            familyMembers: members
        });

        // 保存到本地存储
        wx.setStorageSync('familyMembers', members);

        // 提示用户已切换成员
        const activeMember = members.find(item => item.id === memberId);
        wx.showToast({
            title: `已切换到${activeMember.name}`,
            icon: 'success',
            duration: 2000
        });
    },

    // 显示添加成员模态框
    showAddMember: function () {
        this.setData({
            showAddMemberModal: true
        });
    },

    // 关闭添加成员模态框
    closeAddMember: function () {
        this.setData({
            showAddMemberModal: false
        });
    },

    // 添加新成员
    addNewMember: function (e) {
        const { name, role, details } = e.detail.value;

        if (!name || !role) {
            wx.showToast({
                title: '请填写成员信息',
                icon: 'none'
            });
            return;
        }

        const newMember = {
            id: `member_${Date.now()}`,
            name,
            avatar: '/assets/images/default-avatar.png',
            role,
            details: details || '',
            isActive: false
        };

        const members = [...this.data.familyMembers, newMember];

        this.setData({
            familyMembers: members,
            showAddMemberModal: false
        });

        // 保存到本地存储
        wx.setStorageSync('familyMembers', members);

        wx.showToast({
            title: '成员已添加',
            icon: 'success'
        });
    },

    // 跳转到营养信息设置页面
    navigateToNutritionSettings: function () {
        const activeMember = this.data.familyMembers.find(item => item.isActive);
        wx.navigateTo({
            url: `/pages/settings/nutrition-elements-target/nutrition-elements-target?memberId=${activeMember.id}`
        });
    },

    // 跳转到饮食禁忌设置页面
    navigateToDietaryRestrictions: function () {
        const activeMember = this.data.familyMembers.find(item => item.isActive);
        wx.navigateTo({
            url: `/pages/restrictions/restrictions?memberId=${activeMember.id}`
        });
    }
}); 