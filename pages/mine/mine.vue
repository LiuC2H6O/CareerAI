<template>
	<view class="page-container fairy-page">
		<!-- 插画页头：猴子图标在表头上（与其他页面风格统一） -->
		<view class="ip-hero t-sunset custom-nav-hero">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s2">✧</text>
			<view class="ip-hero-row">
				<image class="ip-hero-icon" src="/static/icons/mine.png" mode="aspectFit"></image>
				<view>
					<text class="ip-hero-title">我的空间</text>
					<text class="ip-hero-sub">你的成长，都在这里</text>
				</view>
			</view>
		</view>

		<!-- 个人信息卡片（独立于表头） -->
		<view class="user-card fairy-card">
			<view class="left">
				<image class="avatar" :src="userInfo.imgUrl || 'https://env-00jy6fpv00dp.normal.cloudstatic.cn/users/Bob.jpg'" mode="aspectFill"></image>
				<view class="edit-avatar" @click="editAvatar">
					<text class="icon">📷</text>
				</view>
			</view>
			<view class="right">
				<view v-if="isLogined">
					<view class="nickname">{{ userInfo.nickname || '职航用户' }}</view>
					<view class="email">{{ userInfo.email }}</view>
					<view class="login-days">🔥 已连续登录 {{ loginDays }} 天</view>
				</view>
				<view v-else>
					<view class="login-btn" @click="goToLogin">点击登录</view>
				</view>
			</view>
		</view>

		<!-- 统计卡片 -->
		<view class="stats-cards" v-if="isLogined">
			<view class="stat-item">
				<text class="stat-num">{{ collectCount }}</text>
				<text class="stat-label">收藏</text>
			</view>
			<view class="stat-item">
				<text class="stat-num">{{ assessmentCount }}</text>
				<text class="stat-label">测评</text>
			</view>
			<view class="stat-item">
				<text class="stat-num">{{ loginDays }}</text>
				<text class="stat-label">登录天数</text>
			</view>
			<view class="stat-item">
				<text class="stat-num">{{ cacheSize }}</text>
				<text class="stat-label">缓存</text>
			</view>
		</view>

		<!-- 核心功能列表区 -->
		<view class="menu-list">
			<!-- 把“成长”移到这里 -->
			<view class="menu-item" @click="goToGrowth">
				<view class="item-left">
					<text class="icon">📈</text>
					<text class="menu-text">我的成长档案</text>
				</view>
				<text class="menu-arrow">></text>
			</view>
			
			<!-- 快速跳转测评 -->
			<view class="menu-item" @click="goToAssessment">
				<view class="item-left">
					<text class="icon">📝</text>
					<text class="menu-text">我的测评记录</text>
				</view>
				<text class="menu-arrow">></text>
			</view>
			
			<view class="menu-item" @click="editProfile">
				<view class="item-left">
					<text class="icon">👤</text>
					<text class="menu-text">编辑资料</text>
				</view>
				<text class="menu-arrow">></text>
			</view>
			
			<view class="menu-item" @click="contactUs">
				<view class="item-left">
					<text class="icon">📧</text>
					<text class="menu-text">联系我们</text>
				</view>
				<text class="menu-arrow">></text>
			</view>
			
			<view class="menu-item" @click="clearCache">
				<view class="item-left">
					<text class="icon">🧹</text>
					<text class="menu-text">清除缓存</text>
				</view>
				<text class="menu-arrow">{{ cacheSize }}</text>
			</view>
		</view>

		<!-- 退出登录按钮 -->
		<button class="logout-btn" v-if="isLogined" @click="logoutFn">退出登录</button>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

// 状态变量
const isLogined = ref(false)
const userInfo = ref({})
const loginDays = ref(0)
const collectCount = ref(0)
const assessmentCount = ref(0)
const cacheSize = ref('0KB')

// 每次显示页面时重新获取本地登录态和统计数据
onShow(() => {
	getUserInfoFn()
	getCacheSize()
})

// 获取用户信息
const getUserInfoFn = () => {
	const currentUser = uni.getStorageSync('currentUser')
	if (currentUser) {
		isLogined.value = true
		userInfo.value = currentUser
		updateLoginDays()
		loadStats()
	} else {
		isLogined.value = false
		userInfo.value = {}
	}
}

// 更新登录天数
const updateLoginDays = () => {
	const today = new Date().toDateString()
	let loginData = uni.getStorageSync("LOGIN_DAYS") || { days: 0, lastLogin: '' }

	if (loginData.lastLogin !== today) {
		const yesterday = new Date()
		yesterday.setDate(yesterday.getDate() - 1)
		if (loginData.lastLogin === yesterday.toDateString()) {
			loginData.days += 1
		} else {
			loginData.days = 1
		}
		loginData.lastLogin = today
		uni.setStorageSync("LOGIN_DAYS", loginData)
	}
	loginDays.value = loginData.days || 0
}

// 加载统计数据
const loadStats = () => {
	let collects = uni.getStorageSync("COLLECTS") || []
	collectCount.value = collects.length
	// 这里暂时用缓存里的假数据，后续你可以改成去云端查真实的测评次数
	assessmentCount.value = uni.getStorageSync("EXAMS")?.length || 0
}

// 获取缓存大小
const getCacheSize = () => {
	uni.getStorageInfo({
		success: (res) => {
			const size = res.currentSize || 0
			if (size < 1024) {
				cacheSize.value = size + 'KB'
			} else {
				cacheSize.value = (size / 1024).toFixed(1) + 'MB'
			}
		}
	})
}

// 路由跳转逻辑
const goToLogin = () => {
	uni.navigateTo({ url: '/pages/login/log' })
}

// 去成长档案（注意这里是 navigateTo，因为成长已经不是 Tab 页了）
const goToGrowth = () => {
	if (!isLogined.value) return uni.showToast({ title: '请先登录', icon: 'none' })
	uni.navigateTo({ url: '/pages/growth/record' })
}

// 去测评（注意：测评是 TabBar 页面，必须用 switchTab）
const goToAssessment = () => {
	uni.switchTab({ url: '/pages/assessment/index' })
}

// 编辑头像
const editAvatar = () => {
	if (!isLogined.value) return uni.showToast({ title: '请先登录', icon: 'none' })
	uni.showActionSheet({
		itemList: ['拍照', '从相册选择'],
		success: (res) => {
			const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']
			uni.chooseImage({
				count: 1,
				sourceType: sourceType,
				success: (result) => {
					userInfo.value.imgUrl = result.tempFilePaths[0]
					uni.setStorageSync('currentUser', userInfo.value)
					uni.showToast({ title: '头像更新成功', icon: 'success' })
				}
			})
		}
	})
}

// 编辑资料
const editProfile = () => {
	if (!isLogined.value) return uni.showToast({ title: '请先登录', icon: 'none' })
	uni.showModal({
		title: '修改昵称',
		editable: true,
		placeholderText: '输入新昵称',
		success: (res) => {
			if (res.confirm && res.content) {
				userInfo.value.nickname = res.content
				uni.setStorageSync('currentUser', userInfo.value)
				uni.showToast({ title: '修改成功', icon: 'success' })
			}
		}
	})
}

// 联系我们
const contactUs = () => {
	uni.showModal({
		title: '联系我们',
		content: '📧 邮箱：support@zhihang.ai\n💬 微信：zhihang_ai',
		showCancel: false,
		confirmText: '我知道了'
	})
}

// 清除缓存
const clearCache = () => {
	uni.showModal({
		title: '清除缓存',
		content: '确定要清除所有缓存数据吗？（清除后需重新登录）',
		confirmColor: '#e74c3c',
		success: (res) => {
			if (res.confirm) {
				uni.clearStorage()
				uni.showToast({ title: '缓存已清除', icon: 'success' })
				setTimeout(() => {
					uni.reLaunch({ url: '/pages/mine/mine' })
				}, 1000)
			}
		}
	})
}

// 退出登录
const logoutFn = () => {
	uni.showModal({
		title: "提示",
		content: "您确定要退出登录吗？",
		success: (res) => {
			if (res.confirm) {
				uni.removeStorageSync("currentUser")
				isLogined.value = false
				userInfo.value = {}
				loginDays.value = 0
				uni.showToast({ title: '已退出', icon: 'success' })
			}
		}
	})
}
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	padding-bottom: 40px;
}

/* 个人信息卡片（独立于表头，白底插画风） */
.user-card {
	position: relative;
	overflow: hidden;
	margin: 0 20px 18px;
	padding: 22px 20px;
	display: flex;
	align-items: center;

	.left {
		position: relative;
		width: 80px;
		height: 80px;
		margin-right: 20px;

		.avatar {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			border: 3px solid #FFE0B8;
			background-color: #fff;
		}

		.edit-avatar {
			position: absolute;
			bottom: 0;
			right: 0;
			width: 28px;
			height: 28px;
			background: linear-gradient(135deg, #FF9A3C, #FFB13C);
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;

			.icon {
				font-size: 14px;
			}
		}
	}

	.right {
		position: relative;
		flex: 1;
		color: #5A4633;

		.nickname {
			font-size: 22px;
			font-weight: 800;
			margin-bottom: 5px;
		}
		.email {
			font-size: 13px;
			color: #A08C77;
			margin-bottom: 8px;
		}
		.login-days {
			font-size: 12px;
			color: #F5872C;
		}
		.login-btn {
			background: linear-gradient(135deg, #FF9A3C, #FFB13C);
			color: #fff;
			padding: 8px 16px;
			border-radius: 20px;
			display: inline-block;
			font-size: 14px;
		}
	}
}

/* 统计卡片 */
.stats-cards {
	display: flex;
	margin: 0 20px 20px;
	background: #fff;
	border-radius: 18px;
	padding: 15px 0;
	box-shadow: 0 8px 22px rgba(255, 138, 61, .10);
	border: 1px solid rgba(255, 193, 92, .22);
	position: relative;
	z-index: 10;
	
	.stat-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		
		.stat-num {
			font-size: 20px;
			font-weight: bold;
			color: #333;
		}
		.stat-label {
			font-size: 12px;
			color: #999;
			margin-top: 4px;
		}
	}
}

/* 列表菜单 */
.menu-list {
	margin: 0 20px;
	background: #fff;
	border-radius: 12px;
	padding: 0 15px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.04);
	
	.menu-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18px 0;
		border-bottom: 1px solid #FFF6E8;
		
		&:last-child {
			border-bottom: none;
		}
		
		.item-left {
			display: flex;
			align-items: center;
			
			.icon {
				margin-right: 10px;
				font-size: 16px;
			}
			.menu-text {
				font-size: 15px;
				color: #333;
			}
		}
		
		.menu-arrow {
			color: #CCC;
			font-size: 14px;
		}
	}
}

/* 退出按钮 */
.logout-btn {
	margin: 30px 20px;
	background: #fff;
	color: #FF3B30;
	border-radius: 12px;
	padding: 15px 0;
	text-align: center;
	font-size: 16px;
	font-weight: bold;
	border: none;
	
	&::after {
		border: none;
	}
}
</style>