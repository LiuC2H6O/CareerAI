
<template>
	<view class="page fairy-page">
		<view class="ip-hero t-orange">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s3">✧</text>
			<view class="ip-hero-row">
				<text class="ip-hero-emoji">🚀</text>
				<view>
					<text class="ip-hero-title">加入职航AI</text>
					<text class="ip-hero-sub">创建账号，开启你的职业冒险</text>
				</view>
			</view>
		</view>

		<view class="form-card">
			<view class="field">
				<text class="label">邮箱地址</text>
				<input
					v-model.trim="email"
					class="input"
					type="text"
					placeholder="请输入邮箱地址"
					:maxlength="100"
				/>
			</view>

			<view class="field">
				<text class="label">用户名</text>
				<input
					v-model.trim="nickname"
					class="input"
					type="text"
					placeholder="请输入用户名"
					:maxlength="30"
				/>
			</view>

			<view class="field">
				<text class="label">邮箱验证码</text>
				<view class="code-row">
					<input
						v-model.trim="code"
						class="input code-input"
						type="number"
						placeholder="请输入6位验证码"
						:maxlength="6"
					/>
					<button
						class="code-button"
						:disabled="sending || countdown > 0"
						@click="sendCode"
					>
						{{ codeButtonText }}
					</button>
				</view>
			</view>

			<view class="field">
				<text class="label">设置密码</text>
				<input
					v-model="password"
					class="input"
					password
					placeholder="请设置8-64位密码"
					:maxlength="64"
				/>
			</view>

			<view class="field">
				<text class="label">确认密码</text>
				<input
					v-model="confirmPassword"
					class="input"
					password
					placeholder="请再次输入密码"
					:maxlength="64"
				/>
			</view>

			<button
				class="primary-button"
				:disabled="submitting"
				@click="register"
			>
				{{ submitting ? '注册中...' : '创建账号' }}
			</button>

			<view class="footer">
				<text>已有账号？</text>
				<text class="link" @click="goToLogin">立即登录</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'

const authService = uniCloud.importObject('auth-service')

const email = ref('')
const nickname = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')

const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)

let timer = null

const codeButtonText = computed(() => {
	if (sending.value) return '发送中...'
	if (countdown.value > 0) return `${countdown.value}s后重发`
	return '获取验证码'
})

function toast(title) {
	uni.showToast({
		title,
		icon: 'none'
	})
}

function validEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function startCountdown() {
	if (timer) clearInterval(timer)

	countdown.value = 60

	timer = setInterval(() => {
		if (countdown.value <= 1) {
			clearInterval(timer)
			timer = null
			countdown.value = 0
		} else {
			countdown.value--
		}
	}, 1000)
}

// 发送注册验证码
async function sendCode() {
	if (sending.value || countdown.value > 0) return

	if (!validEmail(email.value)) {
		return toast('请输入正确的邮箱地址')
	}

	sending.value = true

	try {
		const res = await authService.sendCode(email.value)

		if (res?.code === 0) {
			toast('验证码已发送，请查收邮箱')
			startCountdown()
		} else {
			toast(res?.msg || '验证码发送失败')
		}
	} catch (error) {
		console.error(error)
		toast(error?.message || '发送失败，请稍后重试')
	} finally {
		sending.value = false
	}
}

// 注册
async function register() {
	if (submitting.value) return

	if (!validEmail(email.value)) {
		return toast('请输入正确的邮箱地址')
	}

	if (!nickname.value) {
		return toast('请输入用户名')
	}

	if (!/^\d{6}$/.test(code.value)) {
		return toast('请输入6位邮箱验证码')
	}

	if (password.value.length < 8 || password.value.length > 64) {
		return toast('密码长度必须为8至64位')
	}

	if (password.value !== confirmPassword.value) {
		return toast('两次输入的密码不一致')
	}

	submitting.value = true

	try {
		const res = await authService.registerWithCode(
			email.value,
			code.value,
			password.value,
			nickname.value
		)

		if (res?.code !== 0 || !res.data?.token) {
			return toast(res?.msg || '注册失败')
		}

		uni.setStorageSync('token', res.data.token)

		uni.setStorageSync('currentUser', {
			userId: res.data.userId,
			email: res.data.email,
			nickname: res.data.nickname
		})

		uni.showToast({
			title: '注册成功',
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
		toast(error?.message || '注册失败，请稍后重试')
	} finally {
		submitting.value = false
	}
}

function goToLogin() {
	uni.redirectTo({
		url: '/pages/login/log'
	})
}

onUnmounted(() => {
	if (timer) clearInterval(timer)
})
</script>

<style scoped>
.page {
	box-sizing: border-box;
	min-height: 100vh;
	padding: 0 36rpx 60rpx;
}

.header {
	margin: 36rpx 0 48rpx;
	text-align: center;
}

.title {
	display: block;
	color: #17233d;
	font-size: 44rpx;
	font-weight: 700;
}

.subtitle {
	display: block;
	margin-top: 16rpx;
	color: #8a94a6;
	font-size: 26rpx;
}

.form-card {
	padding: 40rpx 32rpx;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 12rpx 40rpx rgba(31, 55, 90, .06);
}

.field {
	margin-bottom: 30rpx;
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
	height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid #FFEAD8;
	border-radius: 12rpx;
	background: #FFFBF5;
	font-size: 28rpx;
}

.code-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.code-input {
	flex: 1;
	min-width: 0;
}

.code-button {
	flex-shrink: 0;
	width: 220rpx;
	height: 88rpx;
	margin: 0;
	padding: 0 10rpx;
	border: 0;
	border-radius: 12rpx;
	background: #FFF6E8;
	color: #EF7A2A;
	font-size: 24rpx;
	line-height: 88rpx;
}

.code-button[disabled] {
	background: #FFF8EE;
	color: #a0a7b4;
}

.primary-button {
	height: 92rpx;
	margin-top: 16rpx;
	border: 0;
	border-radius: 14rpx;
	background: #EF7A2A;
	color: #fff;
	font-size: 30rpx;
	font-weight: 600;
	line-height: 92rpx;
}

.primary-button[disabled] {
	opacity: .6;
}

.footer {
	margin-top: 34rpx;
	text-align: center;
	color: #8a94a6;
	font-size: 26rpx;
}

.link {
	margin-left: 8rpx;
	color: #EF7A2A;
}
</style>
