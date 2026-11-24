<template>
	<view class="container fairy-page">
		<view class="ip-hero t-gold custom-nav-hero">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s2">✧</text>
			<view class="ip-hero-row">
				<image class="ip-hero-icon" src="/static/icons/coach.png" mode="aspectFit"></image>
				<view>
					<text class="ip-hero-title">AI 就业教练</text>
					<text class="ip-hero-sub">全方位求职辅导，一路陪你闯关</text>
				</view>
			</view>
		</view>

		<view class="grid">
			<!-- 简历诊断入口 -->
			<view class="card" @click="goToResume">
				<view class="icon">📝</view>
				<text class="card-title">AI 简历诊断</text>
				<text class="card-desc">智能分析优势与不足</text>
			</view>

			<!-- 模拟面试入口 (后续开发) -->
			<view class="card" @click="goToInterview">
				<view class="icon">🗣️</view>
				<text class="card-title">AI 模拟面试</text>
				<text class="card-desc">沉浸式文字面试训练</text>
			</view>
			
			<!-- 智能对话入口  -->
			<view class="card" @click="goToChat">
				<view class="icon">💬</view>
				<text class="card-title">求职 AI 问答</text>
				<text class="card-desc">解答你的求职疑惑</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	
	const goToInterview = () => {
		uni.navigateTo({ url: '/pages/coach/interview' })
	}
	// 跳转到简历诊断页
	const goToResume = () => {
		uni.navigateTo({
			url: '/pages/coach/resume'
		})
	}

	const goToChat = () => {
		uni.navigateTo({ url: '/pages/coach/chat' })
	}
</script>

<style scoped>
	.container {
		padding: 0 20px 30px;
		min-height: 100vh;
	}

	.title {
		font-size: 24px;
		font-weight: bold;
		display: block;
		margin-bottom: 8px;
		color: #333;
	}

	.subtitle {
		font-size: 14px;
		color: #666;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 15px;
	}

	.card {
		background: #fff;
		padding: 25px 15px;
		border-radius: 18px;
		text-align: center;
		box-shadow: 0 8px 22px rgba(255, 138, 61, .10);
		border: 1px solid rgba(255, 193, 92, .22);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.card:active {
		background-color: #FFF6E8;
	}

	.icon {
		font-size: 32px;
		margin-bottom: 12px;
	}

	.card-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		margin-bottom: 6px;
	}

	.card-desc {
		font-size: 12px;
		color: #999;
	}
</style>