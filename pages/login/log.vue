
<template>
	<view class="page fairy-page">
		<view class="ip-hero t-gold">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s2">✧</text>
			<view class="ip-hero-row">
				<text class="ip-hero-emoji">🔐</text>
				<view>
					<text class="ip-hero-title">欢迎回来</text>
					<text class="ip-hero-sub">登录账号，继续你的职业冒险</text>
				</view>
			</view>
		</view>

		<view class="form-card">
			<view class="field">
				<text class="label">邮箱账号</text>
				<input
					v-model.trim="email"
					class="input"
					type="text"
					placeholder="请输入注册邮箱"
					:maxlength="100"
				/>
			</view>

			<view class="field">
				<text class="label">登录密码</text>
				<input
					v-model="password"
					class="input"
					password
					placeholder="请输入登录密码"
					:maxlength="64"
				/>
			</view>

			<view class="forgot-row">
				<text class="forgot-link" @click="forgotPassword">
					忘记密码？
				</text>
			</view>

			<button
				class="primary-button"
				:disabled="submitting"
				@click="login"
			>
				{{ submitting ? '登录中...' : '登录' }}
			</button>

			<view class="footer">
				<text>还没有账号？</text>
				<text class="link" @click="goToRegister">立即注册</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const authService = uniCloud.importObject('auth-service')

const email = ref('')
const password = ref('')
const submitting = ref(false)

function toast(title) {
	uni.showToast({
		title,
		icon: 'none'
	})
}

function validEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// 账号密码登录
async function login() {
	if (submitting.value) return

	if (!validEmail(email.value)) {
		return toast('请输入正确的邮箱地址')
	}

	if (!password.value) {
		return toast('请输入登录密码')
	}

	submitting.value = true

	try {
		const res = await authService.loginWithPassword(
			email.value,
			password.value
		)

		if (res?.code !== 0 || !res.data?.token) {
			return toast(res?.msg || '登录失败')
		}

		// 保存登录凭证
		uni.setStorageSync('token', res.data.token)

		// 保存用户信息
		uni.setStorageSync('currentUser', {
			userId: res.data.userId,
			email: res.data.email,
			nickname: res.data.nickname
		})

		uni.showToast({
			title: '登录成功',
			icon: 'success'
		})

		setTimeout(() => {
			uni.switchTab({
				url: '/pages/index/index',
				fail: () => {
					uni.reLaunch({
						url: '/pages/index/index'
					})
				}
			})
		}, 500)
	} catch (error) {
		console.error(error)
		toast(error?.message || '登录失败，请稍后重试')
	} finally {
		submitting.value = false
	}
}

function goToRegister() {
	uni.navigateTo({
		url: '/pages/register/register'
	})
}

// 忘记密码：后续接入邮箱验证码重置密码功能
function forgotPassword() {
	uni.showToast({
		title: '密码找回功能尚未开通',
		icon: 'none'
	})
}
</script>

<style scoped>
.page {
	box-sizing: border-box;
	min-height: 100vh;
	padding: 0 36rpx 60rpx;
}

.header {
	margin: 70rpx 0 56rpx;
	text-align: center;
}

.title {
	display: block;
	color: #17233d;
	font-size: 46rpx;
	font-weight: 700;
}

.subtitle {
	display: block;
	margin-top: 18rpx;
	color: #8a94a6;
	font-size: 26rpx;
}

.form-card {
	padding: 44rpx 32rpx;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 12rpx 40rpx rgba(31, 55, 90, .06);
}

.field {
	margin-bottom: 34rpx;
}

.label {
	display: block;
	margin-bottom: 14rpx;
	color: #344054;
	font-size: 26rpx;
	font-weight: 600;
}

.input {
	box-sizing: border-box;
	width: 100%;
	height: 92rpx;
	padding: 0 24rpx;
	border: 2rpx solid #FFEAD8;
	border-radius: 12rpx;
	background: #FFFBF5;
	font-size: 28rpx;
}

.forgot-row {
	display: flex;
	justify-content: flex-end;
	margin-top: -10rpx;
	margin-bottom: 28rpx;
}

.forgot-link {
	color: #EF7A2A;
	font-size: 25rpx;
}

.primary-button {
	height: 96rpx;
	margin-top: 12rpx;
	border: 0;
	border-radius: 14rpx;
	background: #EF7A2A;
	color: #fff;
	font-size: 30rpx;
	font-weight: 600;
	line-height: 96rpx;
}

.primary-button[disabled] {
	opacity: .6;
}

.footer {
	margin-top: 38rpx;
	text-align: center;
	color: #8a94a6;
	font-size: 26rpx;
}

.link {
	margin-left: 8rpx;
	color: #EF7A2A;
}
</style>
