<template>
	<view class="container fairy-page">
		<view class="ip-hero t-peach">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s3">✧</text>
			<view class="ip-hero-row">
				<image class="ip-hero-icon" src="/static/icons/interview-active.png" mode="aspectFit"></image>
				<view>
					<text class="ip-hero-title">AI 模拟面试</text>
					<text class="ip-hero-sub">文字实战演练，克服面试恐惧</text>
				</view>
			</view>
		</view>

		<!-- 初始状态 -->
		<view v-if="step === 0" class="card">
			<view class="desc">我们将针对【前端开发工程师】为你生成一道面试题。</view>
			<button class="btn" @click="startInterview">开始面试</button>
		</view>

		<!-- 答题状态 -->
		<view v-if="step === 1" class="card">
			<view class="q-label">面试官提问：</view>
			<view class="q-text">{{ question }}</view>

			<textarea class="answer-input" v-model="answer" placeholder="请输入你的回答思路..." maxlength="500"></textarea>

			<button class="btn" :disabled="loading" @click="submitAnswer">
				{{ loading ? 'AI 正在评分...' : '提交回答' }}
			</button>
		</view>

		<!-- 结果状态 -->
		<view v-if="step === 2" class="card">
			<view class="score-box">
				<text class="score-label">本次面试得分</text>
				<text class="score-value">{{ feedback.score }}</text>
			</view>

			<view class="result-block">
				<view class="result-title text-green">✨ 表现亮点</view>
				<view v-for="(item, i) in feedback.highlights" :key="'h'+i" class="list-item">• {{ item }}</view>
			</view>

			<view class="result-block">
				<view class="result-title text-blue">💡 改进建议</view>
				<view v-for="(item, i) in feedback.suggestions" :key="'s'+i" class="list-item">• {{ item }}</view>
			</view>

			<button class="btn btn-outline" @click="reset">再试一次</button>
		</view>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue'

	const step = ref(0) // 0:初始 1:答题 2:结果
	const question = ref('')
	const answer = ref('')
	const feedback = ref(null)
	const loading = ref(false)

	const aiService = uniCloud.importObject('ai-service')

	const startInterview = async () => {
		uni.showLoading({
			title: '面试官准备中...'
		})
		try {
			const res = await aiService.interviewQuestion({
				targetJob: '前端开发'
			})
			if (res.code === 0) {
				question.value = res.data
				step.value = 1
			} else {
				uni.showToast({
					title: res.message,
					icon: 'none'
				})
			}
		} catch (e) {
			uni.showToast({
				title: '网络异常',
				icon: 'none'
			})
		}
		uni.hideLoading()
	}

	const submitAnswer = async () => {
		if (answer.value.length < 10) {
			return uni.showToast({
				title: '回答太短啦，至少10个字',
				icon: 'none'
			})
		}

		loading.value = true
		try {
			const res = await aiService.interviewFeedback({
				question: question.value,
				answer: answer.value
			})
			if (res.code === 0) {
				feedback.value = res.data
				step.value = 2
			} else {
				uni.showToast({
					title: res.message,
					icon: 'none'
				})
			}
		} catch (e) {
			uni.showToast({
				title: '评分失败',
				icon: 'none'
			})
		}
		loading.value = false
	}

	const reset = () => {
		step.value = 0
		question.value = ''
		answer.value = ''
		feedback.value = null
	}
</script>

<style scoped>
	.container {
		padding: 0 20px 30px;
		min-height: 100vh;
	}

	.title {
		font-size: 22px;
		font-weight: bold;
		display: block;
		margin-bottom: 5px;
	}

	.subtitle {
		font-size: 14px;
		color: #666;
	}

	.card {
		background: #fff;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.desc {
		font-size: 15px;
		color: #333;
		margin-bottom: 20px;
		line-height: 1.5;
	}

	.btn {
		background-color: #FF8A3D;
		color: white;
		border-radius: 8px;
		font-size: 16px;
		padding: 12px 0;
		margin-top: 15px;
	}

	.btn[disabled] {
		background-color: #FFB877;
	}

	.btn-outline {
		background-color: #fff;
		color: #FF8A3D;
		border: 1px solid #FF8A3D;
	}

	.q-label {
		font-size: 13px;
		color: #999;
		margin-bottom: 8px;
	}

	.q-text {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		line-height: 1.5;
		margin-bottom: 20px;
		padding: 15px;
		background: #FFF8EE;
		border-radius: 8px;
	}

	.answer-input {
		width: 100%;
		height: 150px;
		border: 1px solid #eee;
		border-radius: 8px;
		padding: 15px;
		box-sizing: border-box;
		font-size: 14px;
		margin-bottom: 10px;
	}

	.score-box {
		text-align: center;
		margin-bottom: 20px;
		padding-bottom: 20px;
		border-bottom: 1px dashed #eee;
	}

	.score-label {
		font-size: 14px;
		color: #666;
		display: block;
		margin-bottom: 5px;
	}

	.score-value {
		font-size: 48px;
		font-weight: bold;
		color: #FF9500;
	}

	.result-block {
		margin-bottom: 20px;
	}

	.result-title {
		font-size: 15px;
		font-weight: bold;
		margin-bottom: 10px;
	}

	.text-green {
		color: #34C759;
	}

	.text-blue {
		color: #FF8A3D;
	}

	.list-item {
		font-size: 14px;
		color: #333;
		line-height: 1.6;
		margin-bottom: 5px;
	}
</style>