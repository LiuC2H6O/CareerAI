<template>
	<view class="container fairy-page">
		<view class="ip-hero t-sunset">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s2">✧</text>
			<view class="ip-hero-row">
				<image class="ip-hero-icon" src="/static/icons/resume-active.png" mode="aspectFit"></image>
				<view>
					<text class="ip-hero-title">AI 简历诊断</text>
					<text class="ip-hero-sub">让 AI 帮你的简历闪闪发光</text>
				</view>
			</view>
		</view>
		<view class="desc">粘贴你的简历文本，AI 将为你提供针对性的修改建议。</view>

		<textarea class="resume-input" v-model="resumeText" placeholder="请粘贴简历内容，例如：教育背景、实习经历、项目经验等..."
			maxlength="2000"></textarea>

		<button class="btn" :disabled="loading" @click="submit">
			{{ loading ? 'AI 分析中...' : '开始诊断' }}
		</button>

		<!-- 结果展示区 -->
		<view v-if="result" class="result-area">
			<view class="card">
				<view class="card-title text-green">✨ 你的优势</view>
				<view v-for="(item, i) in result.advantages" :key="'adv'+i" class="list-item">• {{ item }}</view>
			</view>

			<view class="card">
				<view class="card-title text-red">⚠️ 存在的不足</view>
				<view v-for="(item, i) in result.disadvantages" :key="'dis'+i" class="list-item">• {{ item }}</view>
			</view>

			<view class="card">
				<view class="card-title text-blue">💡 修改建议</view>
				<view v-for="(item, i) in result.suggestions" :key="'sug'+i" class="list-item">• {{ item }}</view>
			</view>

			<view class="ai-notice">* 以上结果由 AI 生成，仅供参考，请结合实际情况修改。</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue'

	const resumeText = ref('')
	const loading = ref(false)
	const result = ref(null)

	const aiService = uniCloud.importObject('ai-service')

	const submit = async () => {
		if (resumeText.value.length < 20) {
			return uni.showToast({
				title: '请至少输入20个字',
				icon: 'none'
			})
		}

		loading.value = true
		result.value = null

		try {
			const res = await aiService.resumeAnalysis({
				text: resumeText.value,
				targetJob: '前端开发' // 这里暂时写死，后续可以做成下拉选择
			})

			if (res.code === 0) {
				result.value = res.data
				uni.showToast({
					title: '诊断完成',
					icon: 'success'
				})
			} else {
				uni.showToast({
					title: res.message,
					icon: 'none'
				})
			}
		} catch (e) {
			console.error(e)
			uni.showToast({
				title: '网络或服务异常',
				icon: 'none'
			})
		}
		loading.value = false
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
		margin-bottom: 10px;
	}

	.desc {
		font-size: 14px;
		color: #666;
		margin-bottom: 15px;
	}

	.resume-input {
		width: 100%;
		height: 200px;
		background: #fff;
		border: 1px solid #eee;
		border-radius: 8px;
		padding: 15px;
		box-sizing: border-box;
		font-size: 14px;
		margin-bottom: 20px;
	}

	.btn {
		background-color: #FF8A3D;
		color: white;
		border-radius: 8px;
		font-size: 16px;
		padding: 12px 0;
		margin-bottom: 20px;
	}

	.btn[disabled] {
		background-color: #FFB877;
	}

	.result-area {
		padding-bottom: 30px;
	}

	.card {
		background: #fff;
		border-radius: 10px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.card-title {
		font-size: 16px;
		font-weight: bold;
		margin-bottom: 10px;
		border-bottom: 1px solid #FFF6E8;
		padding-bottom: 8px;
	}

	.text-green {
		color: #34C759;
	}

	.text-red {
		color: #FF3B30;
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

	.ai-notice {
		font-size: 12px;
		color: #999;
		text-align: center;
		margin-top: 20px;
	}
</style>