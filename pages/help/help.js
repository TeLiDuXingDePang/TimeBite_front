// help.js
Page({
    data: {
        activeTab: 'faq',
        faqList: [
            {
                question: '如何设置我的饮食偏好和限制？',
                answer: '您可以在"我的"-"饮食管理"中设置您的饮食偏好和限制，包括过敏原、宗教饮食和自定义限制。',
                isOpen: false
            },
            {
                question: '如何跟踪我的营养摄入？',
                answer: '在记录食物后，系统会自动计算并显示您的营养摄入情况。您可以在"营养"页面查看详细的营养摄入报告和趋势图表。',
                isOpen: false
            },
            {
                question: '如何设置每日营养目标？',
                answer: '您可以在"我的"-"营养元素目标"中设置您的个人营养目标，包括宏量营养素、微量营养素和各种维生素矿物质的摄入目标。',
                isOpen: false
            },
            {
                question: '如何录入食物信息？',
                answer: '您可以通过扫描页面中拍照或手动添加的方式录入食物信息。',
                isOpen: false
            },
            {
                question: '如何保护我的隐私？',
                answer: '我们非常重视用户隐私，您可以在"我的"-"隐私政策"中详细了解我们如何保护您的个人信息。您也可以在设置中管理数据共享和权限设置。',
                isOpen: false
            }
        ],
        feedbackType: '',
        feedbackContent: '',
        imageList: [],
        contactInfo: '',
        canSubmit: false,
        showSuccessModal: false
    },

    onLoad: function () {
        // 页面加载时执行
    },

    // 切换标签
    switchTab: function (e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({
            activeTab: tab
        });
    },

    // 展开/收起FAQ问题
    toggleFaq: function (e) {
        const index = e.currentTarget.dataset.index;
        const faqList = this.data.faqList;
        faqList[index].isOpen = !faqList[index].isOpen;

        this.setData({
            faqList: faqList
        });
    },

    // 复制邮箱
    copyEmail: function () {
        wx.setClipboardData({
            data: '3159268198@qq.com',
            success: function () {
                wx.showToast({
                    title: '邮箱已复制',
                    icon: 'success',
                    duration: 2000
                });
            }
        });
    },

    // 拨打电话
    callService: function () {
        wx.makePhoneCall({
            phoneNumber: '15347602198',
            success: function () {
                console.log('拨打电话成功');
            },
            fail: function (err) {
                console.log('拨打电话失败', err);
            }
        });
    },

    // 复制微信公众号
    copyWechat: function () {
        wx.setClipboardData({
            data: '食光机营养',
            success: function () {
                wx.showToast({
                    title: '公众号已复制',
                    icon: 'success',
                    duration: 2000
                });
            }
        });
    },

    // 选择反馈类型
    selectFeedbackType: function (e) {
        const type = e.currentTarget.dataset.type;
        this.setData({
            feedbackType: type
        });
        this.checkCanSubmit();
    },

    // 输入反馈内容
    inputFeedback: function (e) {
        this.setData({
            feedbackContent: e.detail.value
        });
        this.checkCanSubmit();
    },

    // 选择图片
    chooseImage: function () {
        const that = this;
        wx.chooseImage({
            count: 3 - that.data.imageList.length,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
                const tempFilePaths = res.tempFilePaths;
                const imageList = that.data.imageList.concat(tempFilePaths);

                that.setData({
                    imageList: imageList
                });
            }
        });
    },

    // 预览图片
    previewImage: function (e) {
        const index = e.currentTarget.dataset.index;
        const imageList = this.data.imageList;

        wx.previewImage({
            current: imageList[index],
            urls: imageList
        });
    },

    // 删除图片
    deleteImage: function (e) {
        const index = e.currentTarget.dataset.index;
        const imageList = this.data.imageList;
        imageList.splice(index, 1);

        this.setData({
            imageList: imageList
        });
    },

    // 输入联系方式
    inputContact: function (e) {
        this.setData({
            contactInfo: e.detail.value
        });
    },

    // 检查是否可以提交
    checkCanSubmit: function () {
        const feedbackType = this.data.feedbackType;
        const feedbackContent = this.data.feedbackContent;

        const canSubmit = feedbackType !== '' && feedbackContent.trim() !== '';

        this.setData({
            canSubmit: canSubmit
        });
    },

    // 提交反馈
    submitFeedback: function () {
        if (!this.data.canSubmit) {
            return;
        }

        // 这里实现提交反馈的逻辑
        // 模拟提交成功
        wx.showLoading({
            title: '提交中...',
            mask: true
        });

        const that = this;
        setTimeout(function () {
            wx.hideLoading();

            that.setData({
                showSuccessModal: true,
                feedbackType: '',
                feedbackContent: '',
                imageList: [],
                contactInfo: '',
                canSubmit: false
            });
        }, 1500);
    },

    // 关闭成功弹窗
    closeSuccessModal: function () {
        this.setData({
            showSuccessModal: false
        });
    },

    // 防止冒泡
    preventBubble: function () {
        // 仅用于阻止事件冒泡
        return;
    },

    // 分享
    onShareAppMessage: function () {
        return {
            title: '食光机 - 帮助与反馈',
            path: '/pages/help/help'
        };
    }
}); 