<template>
	<view class="page fairy-page">
		<!-- 顶部插画页头 -->
		<view class="hero ip-hero t-peach">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s2">✧</text>
			<view class="ip-hero-row">
				<text class="ip-hero-emoji">🔮</text>
				<view>
					<text class="hero-title">我的综合职业画像</text>
					<text class="hero-sub">融合性格、兴趣、能力与价值观</text>
				</view>
			</view>
			<view class="progress-line">
				<text class="progress-text">测评进度 {{ completedTests.length }}/4</text>
				<view class="progress-track">
					<view class="progress-fill" :style="{ width: (completedTests.length / 4 * 100) + '%' }"></view>
				</view>
			</view>
		</view>

		<view v-if="loading" class="loading-box">正在生成你的职业画像...</view>

		<block v-else>
			<!-- 未完成的测评提示 -->
			<view v-if="missingTests.length" class="notice-card">
				<text class="notice-title">还有 {{ missingTests.length }} 项测评未完成</text>
				<text class="notice-desc">补全测评后，职业方向推荐会更准确：{{ missingTestNames }}</text>
				<button class="btn btn-sm" @click="goAssessment">去完成测评</button>
			</view>

			<!-- 概览 -->
			<view v-if="profileData.strengths && profileData.strengths.length" class="card">
				<view class="card-head">
					<text class="card-title">画像速览</text>
					<text class="card-tag">{{ profileData.isComplete ? '完整画像' : '阶段性画像' }}</text>
				</view>
				<view class="tag-list">
					<text v-for="(item, index) in profileData.strengths" :key="index" class="pill">{{ item }}</text>
				</view>
				<text class="summary-text">{{ profileData.summary }}</text>
			</view>

			<!-- 1. 性格画像 -->
			<view v-if="profileData.profile && profileData.profile.mbti" class="card">
				<view class="card-head">
					<text class="card-title">性格画像 · MBTI偏好与工作特点</text>
				</view>
				<view class="mbti-type">
					<text class="mbti-code">{{ profileData.profile.mbti.type }}</text>
					<text class="mbti-desc">{{ profileData.profile.mbti.typeProfile }}</text>
				</view>
				<view class="style-list">
					<view v-for="style in profileData.profile.mbti.workStyles" :key="style.code" class="style-item">
						<text class="style-code">{{ style.code }}</text>
						<view class="style-body">
							<text class="style-name">{{ style.name }}</text>
							<text class="style-desc">{{ style.description }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 2. 兴趣画像 -->
			<view v-if="profileData.profile && profileData.profile.holland && profileData.profile.holland.ranking.length"
				class="card">
				<view class="card-head">
					<text class="card-title">兴趣画像 · 霍兰德兴趣排序</text>
					<text class="card-code">{{ profileData.profile.holland.code }}</text>
				</view>
				<view v-for="item in profileData.profile.holland.ranking" :key="item.code" class="bar-row">
					<text class="bar-rank">{{ item.rank }}</text>
					<text class="bar-name">{{ item.name }}</text>
					<view class="bar-track">
						<view class="bar-fill bar-blue" :style="{ width: item.percent + '%' }"></view>
					</view>
					<text class="bar-value">{{ item.score }}</text>
				</view>
			</view>

			<!-- 3. 能力画像 -->
			<view v-if="profileData.profile && profileData.profile.ability" class="card">
				<view class="card-head">
					<text class="card-title">能力画像 · 五项能力优势与短板</text>
					<text class="card-code">{{ profileData.profile.ability.score }}分</text>
				</view>
				<view v-for="item in profileData.profile.ability.dimensions" :key="item.code" class="bar-row">
					<text class="bar-name wide">{{ item.name }}</text>
					<view class="bar-track">
						<view class="bar-fill" :class="'bar-' + item.tone" :style="{ width: item.rate + '%' }"></view>
					</view>
					<text class="bar-value">{{ item.rate }}%</text>
					<text class="bar-level" :class="'text-' + item.tone">{{ item.level }}</text>
				</view>
				<view class="split-row">
					<view class="split-box">
						<text class="split-title strong-title">优势能力</text>
						<text v-for="s in profileData.profile.ability.strengths" :key="s.code" class="split-item">
							{{ s.name }} {{ s.rate }}%</text>
					</view>
					<view class="split-box">
						<text class="split-title weak-title">待提升能力</text>
						<text v-for="s in profileData.profile.ability.weaknesses" :key="s.code" class="split-item">
							{{ s.name }} {{ s.rate }}%</text>
					</view>
				</view>
			</view>

			<!-- 4. 价值画像 -->
			<view v-if="profileData.profile && profileData.profile.value && profileData.profile.value.ranking.length"
				class="card">
				<view class="card-head">
					<text class="card-title">价值画像 · 六项职业价值偏好</text>
				</view>
				<view v-for="item in profileData.profile.value.ranking" :key="item.code" class="rank-row">
					<view class="rank-num" :class="{ 'rank-top': item.rank <= 3 }">{{ item.rank }}</view>
					<text class="rank-name">{{ item.name }}</text>
					<text class="rank-score">{{ item.average }}</text>
				</view>
			</view>

			<!-- 5. 职业方向推荐 -->
			<view v-if="profileData.careerDirections && profileData.careerDirections.length" class="card">
				<view class="card-head">
					<text class="card-title">职业方向 · 值得探索的岗位类别</text>
				</view>
				<view v-for="(dir, index) in profileData.careerDirections" :key="dir.code" class="direction-card">
					<view class="direction-head">
						<text class="direction-rank">{{ index + 1 }}</text>
						<text class="direction-name">{{ dir.name }}</text>
						<text class="direction-score">{{ dir.score }}分</text>
					</view>
					<view class="job-tags">
						<text v-for="job in dir.jobs" :key="job" class="job-tag">{{ job }}</text>
					</view>
					<view v-if="dir.reasons && dir.reasons.length" class="reason-list">
						<text v-for="(reason, i) in dir.reasons" :key="i" class="reason">· {{ reason }}</text>
					</view>
				</view>
			</view>

			<!-- 6. 能力差距分析 -->
			<view v-if="profileData.abilityGap && profileData.abilityGap.gaps.length" class="card">
				<view class="card-head">
					<text class="card-title">个人能力差距分析</text>
					<text class="card-code">{{ profileData.abilityGap.target.name }}</text>
				</view>
				<text class="gap-summary">{{ profileData.abilityGap.summary }}</text>
				<view v-for="gap in profileData.abilityGap.gaps" :key="gap.code" class="gap-row">
					<view class="gap-info">
						<text class="gap-name">{{ gap.name }}</text>
						<text class="gap-value">当前 {{ gap.current === null ? '--' : gap.current }} / 目标 {{ gap.target }}</text>
					</view>
					<view class="bar-track">
						<view class="bar-fill" :class="'bar-' + gap.tone" :style="{ width: (gap.current || 0) + '%' }"></view>
					</view>
					<text class="gap-badge" :class="'text-' + gap.tone">{{ gap.gap > 0 ? '差' + gap.gap + '分' : '已达标' }}</text>
				</view>
			</view>

			<!-- 7. 成长建议 -->
			<view v-if="profileData.developmentAdvice && profileData.developmentAdvice.length" class="card">
				<view class="card-head">
					<text class="card-title">成长建议 · 针对性提升计划</text>
				</view>
				<view v-for="(advice, index) in profileData.developmentAdvice" :key="index" class="advice-row">
					<text class="advice-num">{{ index + 1 }}</text>
					<text class="advice-text">{{ advice }}</text>
				</view>
			</view>

			<!-- 8. AI 职业教练 -->
			<view class="card coach-card">
				<view class="card-head">
					<text class="card-title">AI 职业教练</text>
					<text class="card-tag coach-tag">基于你的画像</text>
				</view>
				<text class="coach-hint">结合你的综合画像，向 AI 教练咨询职业方向、能力提升等个性化问题</text>

				<view class="quick-questions">
					<text v-for="(q, i) in quickQuestions" :key="i" class="quick-q" @click="askQuestion(q)">{{ q }}</text>
				</view>

				<view class="chat-area">
					<view v-for="(msg, index) in chatMessages" :key="index" class="chat-row"
						:class="msg.role === 'user' ? 'chat-user' : 'chat-ai'">
						<view class="chat-bubble">{{ msg.content }}</view>
					</view>
					<view v-if="chatLoading" class="chat-row chat-ai">
						<view class="chat-bubble loading">AI 教练正在思考...</view>
					</view>
				</view>

				<view class="chat-input-row">
					<input class="chat-input" v-model="question" placeholder="输入你想咨询的问题..."
						@confirm="askQuestion()" :disabled="chatLoading" />
					<button class="btn btn-sm send-btn" @click="askQuestion()" :disabled="chatLoading">发送</button>
				</view>
			</view>

			<!-- 底部按钮 -->
			<view class="btn-row">
				<button class="btn btn-outline" @click="goHome">返回首页</button>
				<button class="btn" @click="goGrowth">查看能力雷达</button>
			</view>
		</block>

		<view style="height: 40px;"></view>
	</view>
</template>

<script setup>
	import {
		ref,
		computed,
		onMounted
	} from 'vue'

	const careerService = uniCloud.importObject('career-service')
	const aiService = uniCloud.importObject('ai-service')

	const loading = ref(true)
	const profileData = ref({})
	const question = ref('')
	const chatMessages = ref([])
	const chatLoading = ref(false)

	const quickQuestions = [
		'我适合什么类型的工作？',
		'我应该优先提升哪项能力？',
		'如何根据我的性格选择岗位？'
	]

	const TEST_NAMES = {
		mbti: '性格测评',
		holland: '兴趣测评',
		ability: '能力测评',
		value: '价值观测评'
	}

	const completedTests = computed(() => profileData.value.completedTests || [])
	const missingTests = computed(() => profileData.value.missingTests || [])
	const missingTestNames = computed(() => missingTests.value.map(
		x => TEST_NAMES[x] || x
	).join('、'))

	function getToken() {
		return uni.getStorageSync('token') || ''
	}

	async function loadProfile() {
		loading.value = true
		try {
			const res = await careerService.getCareerProfile(getToken())
			if (res && res.code === 0) {
				profileData.value = res.data || {}
			} else {
				uni.showToast({
					title: (res && res.message) || '画像加载失败',
					icon: 'none'
				})
			}
		} catch (e) {
			console.error('getCareerProfile error:', e)
			uni.showToast({
				title: '画像加载失败，请检查登录状态',
				icon: 'none'
			})
		} finally {
			loading.value = false
		}
	}

	async function askQuestion(preset) {
		const text = (preset || question.value || '').trim()
		if (!text || chatLoading.value) return
		question.value = ''
		chatMessages.value.push({
			role: 'user',
			content: text
		})
		chatLoading.value = true
		try {
			const res = await aiService.careerCoach({
				question: text,
				profile: profileData.value,
				token: getToken()
			})
			if (res && res.code === 0) {
				chatMessages.value.push({
					role: 'assistant',
					content: res.data && res.data.content ? res.data.content : 'AI 暂未返回内容'
				})
			} else {
				uni.showToast({
					title: (res && res.message) || 'AI 教练回答失败',
					icon: 'none'
				})
			}
		} catch (e) {
			console.error('careerCoach error:', e)
			uni.showToast({
				title: 'AI 教练暂时无法回答',
				icon: 'none'
			})
		} finally {
			chatLoading.value = false
		}
	}

	function goHome() {
		uni.switchTab({
			url: '/pages/index/index'
		})
	}

	function goGrowth() {
		uni.navigateTo({
			url: '/pages/growth/record'
		})
	}

	function goAssessment() {
		uni.switchTab({
			url: '/pages/assessment/index'
		})
	}

	onMounted(() => {
		if (!getToken()) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		loadProfile()
	})
</script>

<style scoped>
	.page {
		min-height: 100vh;
		padding: 0 16px 20px;
		box-sizing: border-box;
	}

	.hero {
		position: relative;
		overflow: hidden;
		border-radius: 0 0 40rpx 40rpx;
		margin: 0 -16px 18px;
		padding: 40rpx 36rpx 44rpx;
		background: linear-gradient(135deg, #FFAB76 0%, #FF8A5B 100%);
		color: #fff;
	}

	.hero-title {
		display: block;
		font-size: 20px;
		font-weight: 800;
	}

	.hero-sub {
		display: block;
		font-size: 12px;
		opacity: .9;
		margin: 8px 0 18px;
		line-height: 1.6;
	}

	.progress-line {
		display: flex;
		align-items: center;
	}

	.progress-text {
		font-size: 12px;
		margin-right: 12px;
		white-space: nowrap;
	}

	.progress-track {
		flex: 1;
		height: 6px;
		background: rgba(255, 255, 255, .25);
		border-radius: 6px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #fff;
		border-radius: 6px;
	}

	.loading-box {
		text-align: center;
		color: #8792a3;
		font-size: 14px;
		padding: 60px 0;
	}

	.card {
		background: #fff;
		border-radius: 12px;
		padding: 17px;
		margin-bottom: 14px;
		box-shadow: 0 3px 14px rgba(30, 55, 90, .04);
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.card-title {
		font-size: 15px;
		font-weight: 700;
		color: #27364b;
	}

	.card-tag {
		font-size: 11px;
		color: #EF7A2A;
		background: #FFF6E8;
		padding: 3px 8px;
		border-radius: 10px;
	}

	.card-code {
		font-size: 13px;
		color: #EF7A2A;
		font-weight: 700;
	}

	.coach-tag {
		color: #8b5cf6;
		background: #f3efff;
	}

	.notice-card {
		background: #fff8e8;
		border: 1px solid #ffe4a3;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 14px;
	}

	.notice-title {
		display: block;
		font-size: 14px;
		font-weight: 700;
		color: #a86a00;
	}

	.notice-desc {
		display: block;
		font-size: 12px;
		color: #a58446;
		line-height: 1.6;
		margin: 8px 0 4px;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
	}

	.pill {
		font-size: 12px;
		color: #EF7A2A;
		background: #FFF6E8;
		border-radius: 12px;
		padding: 5px 10px;
		margin: 0 8px 8px 0;
	}

	.summary-text {
		display: block;
		font-size: 12px;
		color: #7b8798;
		line-height: 1.7;
		margin-top: 6px;
	}

	.mbti-type {
		display: flex;
		align-items: center;
		margin-bottom: 16px;
	}

	.mbti-code {
		font-size: 28px;
		font-weight: 800;
		color: #EF7A2A;
		margin-right: 14px;
	}

	.mbti-desc {
		flex: 1;
		font-size: 13px;
		color: #5d6a7d;
		line-height: 1.6;
	}

	.style-item {
		display: flex;
		align-items: flex-start;
		padding: 10px 0;
		border-bottom: 1px solid #FFF8EE;
	}

	.style-item:last-child {
		border-bottom: 0;
	}

	.style-code {
		width: 24px;
		height: 24px;
		line-height: 24px;
		text-align: center;
		background: #FFF6E8;
		color: #EF7A2A;
		border-radius: 50%;
		font-size: 12px;
		font-weight: 700;
		margin-right: 10px;
		flex-shrink: 0;
	}

	.style-body {
		flex: 1;
	}

	.style-name {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #3c4a5e;
	}

	.style-desc {
		display: block;
		font-size: 12px;
		color: #8b96a6;
		line-height: 1.6;
		margin-top: 3px;
	}

	.bar-row {
		display: flex;
		align-items: center;
		padding: 7px 0;
	}

	.bar-rank {
		width: 20px;
		height: 20px;
		line-height: 20px;
		text-align: center;
		font-size: 11px;
		color: #EF7A2A;
		background: #FFF6E8;
		border-radius: 50%;
		margin-right: 8px;
	}

	.bar-name {
		width: 100px;
		font-size: 12px;
		color: #536176;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.bar-name.wide {
		width: 70px;
	}

	.bar-track {
		flex: 1;
		height: 8px;
		background: #FFF6E8;
		border-radius: 6px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 6px;
	}

	.bar-blue,
	.bar-strong {
		background: linear-gradient(90deg, #FFB547, #EF7A2A);
	}

	.bar-good {
		background: linear-gradient(90deg, #6ee7b7, #10b981);
	}

	.bar-weak {
		background: linear-gradient(90deg, #fca5a5, #e56b6b);
	}

	.bar-missing {
		background: #cbd5e1;
	}

	.bar-value {
		width: 44px;
		text-align: right;
		font-size: 12px;
		color: #EF7A2A;
		font-weight: 700;
	}

	.bar-level {
		width: 48px;
		text-align: right;
		font-size: 11px;
	}

	.text-strong,
	.text-good {
		color: #27845b;
	}

	.text-weak {
		color: #d9534f;
	}

	.text-missing {
		color: #94a3b8;
	}

	.split-row {
		display: flex;
		gap: 10px;
		margin-top: 14px;
	}

	.split-box {
		flex: 1;
		background: #f8fafc;
		border-radius: 8px;
		padding: 12px;
	}

	.split-title {
		display: block;
		font-size: 12px;
		font-weight: 700;
		margin-bottom: 8px;
	}

	.strong-title {
		color: #27845b;
	}

	.weak-title {
		color: #d9534f;
	}

	.split-item {
		display: block;
		font-size: 12px;
		color: #5d6a7d;
		line-height: 1.8;
	}

	.rank-row {
		display: flex;
		align-items: center;
		padding: 9px 0;
		border-bottom: 1px solid #FFF8EE;
	}

	.rank-row:last-child {
		border-bottom: 0;
	}

	.rank-num {
		width: 22px;
		height: 22px;
		line-height: 22px;
		text-align: center;
		font-size: 11px;
		color: #94a3b8;
		background: #f1f5f9;
		border-radius: 50%;
		margin-right: 10px;
	}

	.rank-num.rank-top {
		color: #fff;
		background: #EF7A2A;
	}

	.rank-name {
		flex: 1;
		font-size: 13px;
		color: #536176;
	}

	.rank-score {
		font-size: 13px;
		color: #EF7A2A;
		font-weight: 700;
	}

	.direction-card {
		background: #f8fafc;
		border-radius: 9px;
		padding: 13px;
		margin-bottom: 10px;
	}

	.direction-head {
		display: flex;
		align-items: center;
	}

	.direction-rank {
		width: 22px;
		height: 22px;
		line-height: 22px;
		text-align: center;
		font-size: 12px;
		font-weight: 700;
		color: #fff;
		background: #EF7A2A;
		border-radius: 6px;
		margin-right: 9px;
	}

	.direction-name {
		flex: 1;
		font-size: 14px;
		font-weight: 700;
		color: #2f3d52;
	}

	.direction-score {
		font-size: 13px;
		font-weight: 700;
		color: #EF7A2A;
	}

	.job-tags {
		display: flex;
		flex-wrap: wrap;
		margin: 10px 0 4px;
	}

	.job-tag {
		font-size: 11px;
		color: #526174;
		background: #e8eef7;
		border-radius: 5px;
		padding: 4px 8px;
		margin: 0 6px 6px 0;
	}

	.reason-list {
		margin-top: 4px;
	}

	.reason {
		display: block;
		font-size: 11px;
		color: #8b96a6;
		line-height: 1.7;
	}

	.gap-summary {
		display: block;
		font-size: 12px;
		color: #68768a;
		line-height: 1.7;
		margin-bottom: 12px;
	}

	.gap-row {
		padding: 8px 0;
	}

	.gap-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.gap-name {
		font-size: 12px;
		color: #3c4a5e;
		font-weight: 600;
	}

	.gap-value {
		font-size: 11px;
		color: #94a3b8;
	}

	.gap-badge {
		display: block;
		text-align: right;
		font-size: 11px;
		margin-top: 4px;
	}

	.advice-row {
		display: flex;
		align-items: flex-start;
		padding: 9px 0;
		border-bottom: 1px dashed #FFF6E8;
	}

	.advice-row:last-child {
		border-bottom: 0;
	}

	.advice-num {
		width: 20px;
		height: 20px;
		line-height: 20px;
		text-align: center;
		background: #FFF6E8;
		color: #EF7A2A;
		border-radius: 50%;
		font-size: 11px;
		margin-right: 10px;
		flex-shrink: 0;
	}

	.advice-text {
		flex: 1;
		font-size: 12px;
		color: #5d6a7d;
		line-height: 1.7;
	}

	.coach-hint {
		display: block;
		font-size: 12px;
		color: #8b96a6;
		line-height: 1.6;
	}

	.quick-questions {
		display: flex;
		flex-wrap: wrap;
		margin: 12px 0;
	}

	.quick-q {
		font-size: 11px;
		color: #7c3aed;
		background: #f5f0ff;
		border-radius: 12px;
		padding: 6px 10px;
		margin: 0 8px 8px 0;
	}

	.chat-area {
		background: #f8fafc;
		border-radius: 9px;
		padding: 12px;
		max-height: 320px;
		overflow-y: auto;
	}

	.chat-row {
		display: flex;
		margin-bottom: 10px;
	}

	.chat-user {
		justify-content: flex-end;
	}

	.chat-ai {
		justify-content: flex-start;
	}

	.chat-bubble {
		max-width: 85%;
		padding: 10px 12px;
		border-radius: 10px;
		font-size: 12px;
		line-height: 1.7;
		white-space: pre-wrap;
	}

	.chat-user .chat-bubble {
		background: #EF7A2A;
		color: #fff;
	}

	.chat-ai .chat-bubble {
		background: #fff;
		color: #3c4a5e;
		box-shadow: 0 1px 5px rgba(0, 0, 0, .05);
	}

	.chat-bubble.loading {
		color: #94a3b8;
	}

	.chat-input-row {
		display: flex;
		margin-top: 12px;
	}

	.chat-input {
		flex: 1;
		height: 38px;
		background: #f1f5f9;
		border-radius: 8px;
		padding: 0 12px;
		font-size: 13px;
	}

	.send-btn {
		margin-left: 8px;
		width: 64px;
	}

	.btn {
		background: #EF7A2A;
		color: #fff;
		border: 0;
		border-radius: 8px;
		font-size: 14px;
	}

	.btn::after {
		border: 0;
	}

	.btn-outline {
		color: #EF7A2A;
		background: #fff;
		border: 1px solid #EF7A2A;
	}

	.btn-sm {
		font-size: 12px;
		padding: 0 10px;
		height: 32px;
		line-height: 32px;
		margin: 8px 0 0;
	}

	.btn-row {
		display: flex;
		gap: 12px;
		margin-top: 4px;
	}

	.btn-row .btn {
		flex: 1;
		height: 42px;
		line-height: 42px;
	}

	.notice-card .btn-sm {
		float: right;
	}
</style>
