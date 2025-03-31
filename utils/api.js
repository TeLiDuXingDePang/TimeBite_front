// utils/api.js
// API工具类

// API基础URL
const BASE_URL = 'http://192.168.52.221:5000/api/v1';

// 静态资源基础URL (与API服务器相同)
const STATIC_URL = 'http://192.168.52.221:5000';

/**
 * 获取API基础URL
 * @returns {String} API基础URL
 */
function getApiBaseUrl() {
    return BASE_URL;
}

/**
 * 发送网络请求
 * @param {Object} options 请求配置
 * @returns {Promise} 请求Promise
 */
function request(options) {
    return new Promise((resolve, reject) => {
        console.log('发送API请求:', {
            url: `${BASE_URL}${options.url}`,
            method: options.method || 'GET',
            dataType: typeof options.data
        });

        // 获取token
        const token = wx.getStorageSync('token');

        // 设置请求头
        const header = {
            'Content-Type': 'application/json'
        };

        // 如果有token，添加到请求头
        if (token) {
            header['Authorization'] = `Bearer ${token}`;
        }

        // 发送请求
        wx.request({
            url: `${BASE_URL}${options.url}`,
            method: options.method || 'GET',
            data: options.data,
            header: {
                ...header,
                ...options.header
            },
            success: (res) => {
                console.log('API响应:', {
                    statusCode: res.statusCode,
                    dataType: typeof res.data,
                    isSuccess: res.statusCode >= 200 && res.statusCode < 300
                });

                // 处理响应
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                } else {
                    // 处理错误响应
                    const error = new Error(`请求失败: ${res.statusCode}`);
                    error.response = res;
                    console.error('API请求失败:', error);
                    reject(error);

                    // 处理401未授权错误
                    if (res.statusCode === 401) {
                        handleUnauthorized();
                    }
                }
            },
            fail: (err) => {
                console.error('API请求错误:', err);
                reject(err);
            }
        });
    });
}

/**
 * 处理未授权错误
 */
function handleUnauthorized() {
    // 清除本地存储的登录信息
    wx.removeStorageSync('token');
    wx.removeStorageSync('tokenExpireTime');
    wx.removeStorageSync('userInfo');

    // 重置全局登录状态
    const app = getApp();
    app.globalData.isLoggedIn = false;
    app.globalData.userInfo = null;

    // 跳转到登录页
    wx.redirectTo({
        url: '/pages/login/login'
    });
}

/**
 * 用户登录请求 - 使用Base64方式上传头像
 * @param {Object} data 登录数据
 * @returns {Promise} 登录Promise
 */
function loginWithBase64(data) {
    console.log('Base64登录请求参数:', {
        nickname: data.nickname,
        avatarUrl: data.avatarUrl ? '已设置(Base64)' : '未设置',
        code: data.code,
        loginTime: data.loginTime
    });

    return request({
        url: '/user/login',
        method: 'POST',
        data
    }).then(response => {
        console.log('Base64登录响应:', response);
        // 处理可能包含NaN的响应字符串
        if (typeof response === 'string') {
            try {
                // 替换NaN为字符串"NaN"以便能正常解析
                const cleanedJson = response.replace(/:\s*NaN\s*([,}])/g, ':"NaN"$1');
                console.log('清理后的JSON字符串:', cleanedJson);
                response = JSON.parse(cleanedJson);

                // 遍历对象，将"NaN"字符串转为null
                const convertNaNStrings = (obj) => {
                    if (!obj || typeof obj !== 'object') return;
                    Object.keys(obj).forEach(key => {
                        if (obj[key] === "NaN") {
                            obj[key] = null;
                        } else if (typeof obj[key] === 'object') {
                            convertNaNStrings(obj[key]);
                        }
                    });
                };
                convertNaNStrings(response);
            } catch (e) {
                console.error('Base64登录响应解析失败:', e);
                // 保持原始响应
            }
        }
        return response;
    }).catch(error => {
        console.error('Base64登录失败:', error);
        throw error;
    });
}

/**
 * 用户登录请求 - 使用FormData方式上传头像
 * @param {Object} params 登录参数
 * @returns {Promise} 登录Promise
 */
function loginWithFormData(params) {
    return new Promise((resolve, reject) => {
        console.log('FormData登录请求参数:', params);
        wx.uploadFile({
            url: `${BASE_URL}/user/login`,
            filePath: params.avatarUrl,
            name: 'avatarFile',
            formData: {
                nickname: params.nickname,
                code: params.code,
                loginTime: params.loginTime
            },
            success: (res) => {
                console.log('FormData登录响应:', res);
                try {
                    // 确保响应数据是对象
                    let result;
                    if (typeof res.data === 'string') {
                        console.log('响应是字符串，尝试解析JSON');
                        // 处理可能包含NaN的JSON
                        const cleanedJson = res.data.replace(/:\s*NaN\s*([,}])/g, ':"NaN"$1');
                        console.log('清理后的FormData响应JSON:', cleanedJson);
                        result = JSON.parse(cleanedJson);

                        // 遍历对象，将"NaN"字符串转为null
                        const convertNaNStrings = (obj) => {
                            if (!obj || typeof obj !== 'object') return;
                            Object.keys(obj).forEach(key => {
                                if (obj[key] === "NaN") {
                                    obj[key] = null;
                                } else if (typeof obj[key] === 'object') {
                                    convertNaNStrings(obj[key]);
                                }
                            });
                        };
                        convertNaNStrings(result);
                    } else {
                        result = res.data;
                    }
                    console.log('处理后的登录响应数据:', result);
                    resolve(result);
                } catch (e) {
                    console.error('解析响应数据失败:', e);
                    reject(new Error('解析响应数据失败'));
                }
            },
            fail: (err) => {
                console.error('FormData登录请求失败:', err);
                reject(err);
            }
        });
    });
}

/**
 * 上传用户头像
 * @param {String} filePath 本地文件路径
 * @returns {Promise} 上传结果Promise，成功时返回完整的头像URL
 */
function uploadAvatar(filePath) {
    return new Promise((resolve, reject) => {
        console.log('开始上传头像:', filePath);

        // 读取文件为Base64格式
        wx.getFileSystemManager().readFile({
            filePath: filePath,
            encoding: 'base64',
            success: (fileRes) => {
                const base64Avatar = 'data:image/jpeg;base64,' + fileRes.data;

                // 调用用户信息更新接口上传头像
                request({
                    url: '/user/update',
                    method: 'POST',
                    data: {
                        avatarUrl: base64Avatar
                    }
                }).then(res => {
                    console.log('头像上传响应:', res);

                    if (res.code === 0 && res.data && res.data.userInfo) {
                        console.log('头像上传成功，URL:', res.data.userInfo.avatarUrl);
                        resolve(res.data.userInfo.avatarUrl);
                    } else {
                        console.error('头像上传服务器处理失败:', res.message);
                        reject(new Error(res.message || '头像上传失败'));
                    }
                }).catch(err => {
                    console.error('头像上传请求失败:', err);
                    reject(new Error('网络错误，头像上传失败'));
                });
            },
            fail: (err) => {
                console.error('读取头像文件失败:', err);
                reject(new Error('读取头像文件失败'));
            }
        });
    });
}

/**
 * 处理图像URL，确保URL是完整的
 * @param {String} imageUrl 图像URL
 * @returns {String} 完整的图像URL
 */
function getFullImageUrl(imageUrl) {
    console.log('----------头像URL处理开始----------');
    console.log('B1. 原始头像URL:', imageUrl);
    console.log('B2. STATIC_URL值:', STATIC_URL);

    try {
        if (!imageUrl) {
            console.log('B3. 头像URL为空，使用默认头像');
            console.log('----------头像URL处理结束----------');
            return '/assets/images/default-avatar.png'; // 返回默认头像
        }

        // 如果已经是完整的URL（以http或https开头），则直接返回
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            console.log('B4. 头像已是完整URL，无需处理');
            console.log('----------头像URL处理结束----------');
            return imageUrl;
        }

        // 如果是以/static开头的相对路径，添加服务器域名
        if (imageUrl.startsWith('/static/')) {
            const fullUrl = `${STATIC_URL}${imageUrl}`;
            console.log('B5. 处理/static路径:', { from: imageUrl, to: fullUrl });
            console.log('----------头像URL处理结束----------');
            return fullUrl;
        }

        // 其他情况，可能是相对路径，也添加域名
        if (imageUrl.startsWith('/')) {
            const fullUrl = `${STATIC_URL}${imageUrl}`;
            console.log('B6. 处理其他/开头路径:', { from: imageUrl, to: fullUrl });
            console.log('----------头像URL处理结束----------');
            return fullUrl;
        }

        // 如果不是以/开头，添加/和域名
        const fullUrl = `${STATIC_URL}/${imageUrl}`;
        console.log('B7. 处理无/开头路径:', { from: imageUrl, to: fullUrl });
        console.log('----------头像URL处理结束----------');
        return fullUrl;
    } catch (error) {
        console.error('B8. 处理头像URL出错:', error, '原始URL:', imageUrl);
        console.error('B9. 错误堆栈:', error.stack);
        console.log('----------头像URL处理结束----------');
        return '/assets/images/default-avatar.png'; // 错误时返回默认头像
    }
}

/**
 * 获取菜谱推荐
 * @param {Object} options 可选参数
 * @param {Number} options.limit 返回的推荐菜谱数量，默认为10
 * @param {Array} options.ingredients 基于特定食材推荐菜谱
 * @returns {Promise} 推荐菜谱Promise
 */
function getRecipeRecommendations(options = {}) {
    let url = '/recipe/recommendations';
    const queryParams = [];

    // 如果指定了limit参数，添加到URL查询参数中
    if (options.limit) {
        queryParams.push(`limit=${options.limit}`);
    }

    // 如果指定了食材，添加到请求中
    if (options.ingredients && Array.isArray(options.ingredients) && options.ingredients.length > 0) {
        // 将食材列表转换为逗号分隔的字符串并编码
        const ingredientsParam = encodeURIComponent(options.ingredients.join(','));
        queryParams.push(`ingredients=${ingredientsParam}`);
    }

    // 构建完整URL
    if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
    }

    return request({
        url: url,
        method: 'GET'
    }).then(response => {
        console.log('获取菜谱推荐响应:', response);
        return response;
    }).catch(error => {
        console.error('获取菜谱推荐失败:', error);
        throw error;
    });
}

/**
 * 获取食材库存统计
 * @returns {Promise} 食材库存统计数据的Promise
 */
function getIngredientsStats() {
    return request({
        url: '/ingredients/stats',
        method: 'GET'
    }).then(response => {
        console.log('获取食材库存统计响应:', response);
        return response;
    }).catch(error => {
        console.error('获取食材库存统计失败:', error);
        throw error;
    });
}

/**
 * 获取菜谱详情
 * @param {Number} recipeId 菜谱ID
 * @returns {Promise} 菜谱详情Promise
 */
function getRecipeDetail(recipeId) {
    if (!recipeId) {
        return Promise.reject(new Error('菜谱ID不能为空'));
    }

    return request({
        url: `/recipes/${recipeId}/detail`,
        method: 'GET'
    }).then(response => {
        console.log('获取菜谱详情响应:', response);
        return response;
    }).catch(error => {
        console.error('获取菜谱详情失败:', error);
        throw error;
    });
}

/**
 * 获取最快过期的食材信息
 * @returns {Promise} 最快过期食材信息的Promise
 */
function getMostExpiringIngredient() {
    return request({
        url: '/ingredients/most-expiring',
        method: 'GET'
    }).then(response => {
        console.log('获取最快过期食材响应:', response);
        return response;
    }).catch(error => {
        console.error('获取最快过期食材失败:', error);
        throw error;
    });
}

/**
 * 获取最快过期的最多5个食材列表
 * @returns {Promise} 最快过期食材列表的Promise
 */
function getTopExpiringIngredients() {
    return request({
        url: '/ingredients/top-expiring',
        method: 'GET'
    }).then(response => {
        console.log('获取最快过期食材列表响应:', response);
        return response;
    }).catch(error => {
        console.error('获取最快过期食材列表失败:', error);
        throw error;
    });
}

/**
 * 获取基于过期食材匹配的菜谱推荐
 * @param {Object} options 可选参数
 * @param {Number} options.top_n 考虑的最快过期食材数量，默认为5
 * @param {Number} options.count 返回的菜谱数量，默认为3
 * @returns {Promise} 匹配菜谱的Promise
 */
function getMatchingRecipesForExpiring(options = {}) {
    let url = '/recipes/match-expiring';

    // 构建查询参数
    const queryParams = [];
    if (options.top_n) {
        queryParams.push(`top_n=${options.top_n}`);
    }
    if (options.count) {
        queryParams.push(`count=${options.count}`);
    }

    // 添加查询参数到URL
    if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
    }

    return request({
        url: url,
        method: 'GET'
    }).then(response => {
        console.log('获取匹配过期食材的菜谱响应:', response);
        return response;
    }).catch(error => {
        console.error('获取匹配过期食材的菜谱失败:', error);
        throw error;
    });
}

/**
 * 获取用户所有食材信息
 * @returns {Promise} 食材列表Promise
 */
function getAllIngredients() {
    return request({
        url: '/ingredients/all',
        method: 'GET'
    }).then(response => {
        console.log('获取食材库存列表响应:', response);
        return response;
    }).catch(error => {
        console.error('获取食材库存列表失败:', error);
        throw error;
    });
}

/**
 * 删除用户食材库中的指定食材
 * @param {Number} ingredientId 要删除的食材ID
 * @returns {Promise} 删除操作的Promise
 */
function deleteIngredient(ingredientId) {
    if (!ingredientId) {
        return Promise.reject(new Error('食材ID不能为空'));
    }

    return request({
        url: `/ingredients/${ingredientId}`,
        method: 'DELETE'
    }).then(response => {
        console.log('删除食材响应:', response);
        return response;
    }).catch(error => {
        console.error('删除食材失败:', error);
        throw error;
    });
}

/**
 * 更新用户食材库中的指定食材信息
 * @param {Number} ingredientId 要更新的食材ID
 * @param {Object} data 更新数据，可包含quantity和expiry_date
 * @returns {Promise} 更新操作的Promise
 */
function updateIngredient(ingredientId, data) {
    if (!ingredientId) {
        return Promise.reject(new Error('食材ID不能为空'));
    }

    // 验证参数
    if (!data || (data.quantity === undefined && data.expiry_date === undefined)) {
        return Promise.reject(new Error('请至少提供一个需要更新的字段(quantity或expiry_date)'));
    }

    // 验证数量
    if (data.quantity !== undefined && (isNaN(data.quantity) || data.quantity <= 0)) {
        return Promise.reject(new Error('食材数量必须是正数'));
    }

    // 验证日期格式
    if (data.expiry_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.expiry_date)) {
        return Promise.reject(new Error('日期格式必须为YYYY-MM-DD'));
    }

    return request({
        url: `/ingredients/${ingredientId}`,
        method: 'PUT',
        data: data
    }).then(response => {
        console.log('更新食材响应:', response);
        return response;
    }).catch(error => {
        console.error('更新食材失败:', error);
        throw error;
    });
}

/**
 * 上传食物图片进行识别分析
 * @param {String} filePath 食物图片的本地文件路径
 * @returns {Promise} 图像分析结果的Promise
 */
function analyzeFoodImage(filePath) {
    return new Promise((resolve, reject) => {
        console.log('开始上传食物图片进行分析:', filePath);

        wx.uploadFile({
            url: `${BASE_URL}/food-vision/analyze`,
            filePath: filePath,
            name: 'food_image',
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token')}`
            },
            success: (res) => {
                console.log('食物图片分析响应:', res);
                try {
                    // 确保响应数据是对象
                    let result;
                    if (typeof res.data === 'string') {
                        result = JSON.parse(res.data);
                    } else {
                        result = res.data;
                    }

                    if (result.code === 200) {
                        console.log('食物图片分析成功:', result.data);
                        resolve(result.data);
                    } else {
                        console.error('食物图片分析服务器处理失败:', result.message);
                        reject(new Error(result.message || '食物图片分析失败'));
                    }
                } catch (e) {
                    console.error('解析食物图片分析响应失败:', e);
                    reject(new Error('解析食物图片分析响应失败'));
                }
            },
            fail: (err) => {
                console.error('食物图片分析请求失败:', err);
                reject(new Error('网络错误，食物图片分析失败'));
            }
        });
    });
}

// 导出API方法
module.exports = {
    request,
    loginWithBase64,
    loginWithFormData,
    getFullImageUrl,
    getApiBaseUrl,
    uploadAvatar,
    getRecipeRecommendations,
    getIngredientsStats,
    getRecipeDetail,
    getMostExpiringIngredient,
    getTopExpiringIngredients,
    getMatchingRecipesForExpiring,
    getAllIngredients,
    deleteIngredient,
    updateIngredient,
    analyzeFoodImage
}; 