// nutrition.js
import * as echarts from '../../components/ec-canvas/echarts';

// 图表实例对象
let pieChart = null;
let lineChart = null;

// 初始化饼图
function initPieChart(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
    });
    canvas.setChart(chart);

    const option = {
        backgroundColor: '#fff',
        color: ['#4CAF50', '#FF9800', '#2196F3'],
        series: [{
            name: '营养素比例',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '18',
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: false
            },
            data: [
                { value: 40, name: '蛋白质' },
                { value: 30, name: '脂肪' },
                { value: 80, name: '碳水' }
            ]
        }]
    };

    chart.setOption(option);
    pieChart = chart;
    return chart;
}

// 初始化折线图
function initLineChart(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
    });
    canvas.setChart(chart);

    const option = {
        backgroundColor: '#fff',
        color: ['#4CAF50', '#FF9800'],
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: {
            type: 'value',
            name: '热量(千卡)',
            nameTextStyle: {
                padding: [0, 0, 0, 30]
            }
        },
        series: [
            {
                name: '实际摄入',
                type: 'line',
                smooth: true,
                data: [1500, 1800, 1600, 1900, 1700, 2000, 1800]
            },
            {
                name: '目标摄入',
                type: 'line',
                smooth: true,
                lineStyle: {
                    type: 'dashed'
                },
                data: [1800, 1800, 1800, 1800, 1800, 1800, 1800]
            }
        ]
    };

    chart.setOption(option);
    lineChart = chart;
    return chart;
}

Page({
    data: {
        currentDate: '',
        selectedRange: 'day', // 默认选择今日
        rangeTitleMap: {
            'day': '今日',
            'week': '本周',
            'month': '本月'
        },
        nutritionData: {
            protein: 40,
            fat: 30,
            carbs: 80,
            averageCalories: 1757,
            caloriesStatus: 'normal', // normal 或 warning
            caloriesData: [
                { date: '周一', value: 1500 },
                { date: '周二', value: 1800 },
                { date: '周三', value: 1600 },
                { date: '周四', value: 1900 },
                { date: '周五', value: 1700 },
                { date: '周六', value: 2000 },
                { date: '周日', value: 1800 }
            ],
            targetCalories: 1800
        },
        nutritionDetails: [
            {
                name: '维生素A',
                value: 850,
                target: 1000,
                unit: 'μg',
                percentage: 85,
                color: '#4CAF50',
                sources: [
                    { food: '胡萝卜', percentage: 45 },
                    { food: '菠菜', percentage: 30 },
                    { food: '鸡蛋', percentage: 25 }
                ]
            },
            {
                name: '维生素C',
                value: 90,
                target: 100,
                unit: 'mg',
                percentage: 90,
                color: '#FF9800',
                sources: [
                    { food: '橙子', percentage: 50 },
                    { food: '西红柿', percentage: 30 },
                    { food: '青椒', percentage: 20 }
                ]
            },
            {
                name: '维生素D',
                value: 6,
                target: 10,
                unit: 'μg',
                percentage: 60,
                color: '#2196F3',
                sources: [
                    { food: '鱼油', percentage: 40 },
                    { food: '蛋黄', percentage: 35 },
                    { food: '牛奶', percentage: 25 }
                ]
            },
            {
                name: '钙',
                value: 700,
                target: 1000,
                unit: 'mg',
                percentage: 70,
                color: '#9C27B0',
                sources: [
                    { food: '牛奶', percentage: 55 },
                    { food: '豆腐', percentage: 25 },
                    { food: '小白菜', percentage: 20 }
                ]
            },
            {
                name: '铁',
                value: 12,
                target: 15,
                unit: 'mg',
                percentage: 80,
                color: '#F44336',
                sources: [
                    { food: '猪肝', percentage: 40 },
                    { food: '菠菜', percentage: 35 },
                    { food: '瘦肉', percentage: 25 }
                ]
            },
            {
                name: '锌',
                value: 9,
                target: 12,
                unit: 'mg',
                percentage: 75,
                color: '#795548',
                sources: [
                    { food: '牡蛎', percentage: 50 },
                    { food: '瘦肉', percentage: 30 },
                    { food: '坚果', percentage: 20 }
                ]
            }
        ],
        nutritionAdvice: [
            {
                id: 1,
                icon: '🥕',
                title: '增加维生素D摄入',
                content: '您的维生素D摄入不足，建议多吃鱼类、蛋黄，或适当晒太阳。'
            },
            {
                id: 2,
                icon: '🥛',
                title: '补充钙质',
                content: '钙摄入达标率为70%，建议增加奶制品、豆制品的摄入。'
            },
            {
                id: 3,
                icon: '🍎',
                title: '均衡饮食',
                content: '您的碳水化合物摄入偏高，建议适当增加蛋白质食物，减少精制碳水。'
            }
        ],
        pieEc: {
            onInit: initPieChart,
            disableTouch: false,
            lazyLoad: false
        },
        lineEc: {
            onInit: initLineChart,
            disableTouch: false,
            lazyLoad: false
        },
        showSourceModal: false,
        currentNutrition: {}
    },

    onLoad: function () {
        this.updateDate();
    },

    onShow: function () {
        this.updateDate();
    },

    onReady: function () {
        // 获取组件上下文
        this.pieChartComponent = this.selectComponent('#pieChart');
        this.lineChartComponent = this.selectComponent('#lineChart');

        // 初始化图表
        this.initCharts();

        // 获取图表的尺寸信息
        const query = wx.createSelectorQuery();
        query.selectAll('.chart-container').boundingClientRect().exec((res) => {
            if (res && res[0] && res[0].length > 0) {
                this.chartWidth = res[0][0].width;
                this.chartContainerWidth = res[0][0].width;
            }
        });
    },

    // 监听滚动事件
    onChartScroll: function (e) {
        // 记录当前滚动位置
        this.scrollLeft = e.detail.scrollLeft;

        // 计算当前显示的是哪个图表
        if (this.chartContainerWidth) {
            const currentIndex = Math.round(this.scrollLeft / this.chartContainerWidth);

            // 如果index变化，刷新对应图表
            if (this.currentChartIndex !== currentIndex) {
                this.currentChartIndex = currentIndex;
                this.refreshCurrentChart();
            }
        }
    },

    // 根据index刷新当前显示的图表
    refreshCurrentChart: function () {
        if (this.currentChartIndex === 0) {
            this.refreshPieChart();
        } else if (this.currentChartIndex === 1) {
            this.refreshLineChart();
        }
    },

    // 刷新所有图表
    refreshCharts: function () {
        // 直接刷新两个图表，无需延迟
        this.refreshPieChart();
        this.refreshLineChart();
    },

    // 刷新饼图
    refreshPieChart: function () {
        if (this.pieChart) {
            // 更新已存在的图表实例
            this.pieChart.setOption(this.getPieChartOption());
            return;
        }

        // 如果图表实例不存在，则初始化
        this.initPieChart();
    },

    // 刷新折线图
    refreshLineChart: function () {
        if (this.lineChart) {
            // 更新已存在的图表实例
            this.lineChart.setOption(this.getLineChartOption());
            return;
        }

        // 如果图表实例不存在，则初始化
        this.initLineChart();
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

    // 切换时间范围
    switchRange: function (e) {
        const range = e.currentTarget.dataset.range;
        this.setData({
            selectedRange: range
        });

        // 根据选择的时间范围更新数据
        this.updateDataByRange(range);

        // 更新图表数据
        setTimeout(() => {
            this.updateChartData();
        }, 100);
    },

    // 更新图表数据
    updateChartData: function (data) {
        this.setData({
            nutritionData: data
        }, () => {
            // 在数据更新后刷新两个图表
            this.refreshCharts();
        });
    },

    // 根据时间范围更新数据
    updateDataByRange: function (range) {
        // 这里可以根据不同的时间范围请求不同的数据
        // 目前使用模拟数据
        let nutritionData = {};

        switch (range) {
            case 'day':
                nutritionData = {
                    protein: 40,
                    fat: 30,
                    carbs: 80,
                    averageCalories: 1757,
                    caloriesStatus: 'normal',
                    caloriesData: [
                        { date: '周一', value: 1500 },
                        { date: '周二', value: 1800 },
                        { date: '周三', value: 1600 },
                        { date: '周四', value: 1900 },
                        { date: '周五', value: 1700 },
                        { date: '周六', value: 2000 },
                        { date: '周日', value: 1800 }
                    ],
                    targetCalories: 1800
                };
                break;
            case 'week':
                nutritionData = {
                    protein: 45,
                    fat: 35,
                    carbs: 75,
                    averageCalories: 1820,
                    caloriesStatus: 'warning',
                    caloriesData: [
                        { date: '周一', value: 1500 },
                        { date: '周二', value: 1800 },
                        { date: '周三', value: 1600 },
                        { date: '周四', value: 1900 },
                        { date: '周五', value: 1700 },
                        { date: '周六', value: 2000 },
                        { date: '周日', value: 1800 }
                    ],
                    targetCalories: 1800
                };
                break;
            case 'month':
                nutritionData = {
                    protein: 42,
                    fat: 33,
                    carbs: 78,
                    averageCalories: 1790,
                    caloriesStatus: 'normal',
                    caloriesData: [
                        { date: '周一', value: 1500 },
                        { date: '周二', value: 1800 },
                        { date: '周三', value: 1600 },
                        { date: '周四', value: 1900 },
                        { date: '周五', value: 1700 },
                        { date: '周六', value: 2000 },
                        { date: '周日', value: 1800 }
                    ],
                    targetCalories: 1800
                };
                break;
        }

        this.setData({
            nutritionData: nutritionData
        });
    },

    // 显示营养素来源弹窗
    showNutritionSource: function (e) {
        const name = e.currentTarget.dataset.name;
        const nutrition = this.data.nutritionDetails.find(item => item.name === name);

        if (nutrition) {
            this.setData({
                showSourceModal: true,
                currentNutrition: nutrition
            });
        }
    },

    // 隐藏营养素来源弹窗
    hideSourceModal: function () {
        this.setData({
            showSourceModal: false
        });
    },

    // 阻止事件冒泡
    stopPropagation: function () {
        return;
    },

    /**
     * 初始化所有图表
     */
    initCharts: function () {
        // 直接初始化图表，无需延迟
        this.initPieChart();

        // 稍微延迟初始化第二个图表，避免资源竞争
        setTimeout(() => {
            this.initLineChart();
        }, 100);
    },

    /**
     * 初始化饼图
     */
    initPieChart: function () {
        // 简化初始化逻辑
        this.pieChartComponent.init((canvas, width, height, dpr) => {
            const chart = echarts.init(canvas, null, {
                width: width,
                height: height,
                devicePixelRatio: dpr,
                renderer: 'canvas'
            });

            // 直接设置无动画配置
            chart.setOption(this.getPieChartOption());
            this.pieChart = chart;
            return chart;
        });
    },

    /**
     * 初始化折线图
     */
    initLineChart: function () {
        // 简化初始化逻辑
        this.lineChartComponent.init((canvas, width, height, dpr) => {
            const chart = echarts.init(canvas, null, {
                width: width,
                height: height,
                devicePixelRatio: dpr,
                renderer: 'canvas'
            });

            // 直接设置无动画配置
            chart.setOption(this.getLineChartOption());
            this.lineChart = chart;
            return chart;
        });
    },

    /**
     * 获取饼图配置
     */
    getPieChartOption: function () {
        const { protein, fat, carbs } = this.data.nutritionData;
        return {
            backgroundColor: 'transparent',
            color: ['#4CAF50', '#FF9800', '#2196F3'],
            animation: false, // 完全禁用动画
            series: [{
                name: '营养素占比',
                type: 'pie',
                radius: ['35%', '65%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: false,
                stillShowZeroSum: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false
                },
                emphasis: {
                    scale: false,
                    label: {
                        show: true,
                        fontSize: '14',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: [
                    { value: protein, name: '蛋白质' },
                    { value: fat, name: '脂肪' },
                    { value: carbs, name: '碳水' }
                ]
            }]
        };
    },

    /**
     * 获取折线图配置
     */
    getLineChartOption: function () {
        const { caloriesData, targetCalories } = this.data.nutritionData;
        const dates = caloriesData?.map(item => item.date) || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const calories = caloriesData?.map(item => item.value) || [1500, 1800, 1600, 1900, 1700, 2000, 1800];

        return {
            backgroundColor: 'transparent',
            animation: false, // 完全禁用动画
            grid: {
                left: '5%',
                right: '5%',
                bottom: '12%',
                top: '12%',
                containLabel: true
            },
            tooltip: {
                trigger: 'axis',
                formatter: '{b}: {c} 千卡'
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: dates,
                axisLine: {
                    lineStyle: {
                        color: '#999'
                    }
                },
                axisLabel: {
                    color: '#666',
                    fontSize: 11
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#999'
                    }
                },
                axisLabel: {
                    color: '#666',
                    fontSize: 11
                },
                splitLine: {
                    lineStyle: {
                        color: '#eee',
                        type: 'dashed'
                    }
                }
            },
            series: [{
                name: '热量摄入',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: {
                    color: '#4CAF50'
                },
                lineStyle: {
                    width: 3
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: 'rgba(76, 175, 80, 0.4)'
                    }, {
                        offset: 1,
                        color: 'rgba(76, 175, 80, 0.1)'
                    }])
                },
                data: calories
            }, {
                name: '目标热量',
                type: 'line',
                symbol: 'none',
                lineStyle: {
                    color: '#FF9800',
                    width: 2,
                    type: 'dashed'
                },
                data: Array(dates.length).fill(targetCalories || 1800)
            }]
        };
    }
});