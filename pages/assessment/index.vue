<template>
	<view class="container fairy-page">
		<!-- 测评首页 -->
		<view v-if="step === 1">
			<view class="ip-hero t-orange custom-nav-hero">
				<view class="ip-ring r1"></view>
				<view class="ip-ring r2"></view>
				<text class="ip-star s1">✦</text>
				<text class="ip-star s2">✧</text>
				<text class="ip-star s3">✦</text>
				<view class="ip-hero-row">
					<image class="ip-hero-icon" src="/static/icons/assessment-active.png" mode="aspectFit"></image>
					<view>
						<text class="ip-hero-title">职航AI职业测评</text>
						<text class="ip-hero-sub">四类测评 · 遇见更清晰的自己</text>
					</view>
				</view>
			</view>

			<view v-if="listLoading" class="hint">正在加载测评项目...</view>
			<view v-else>
				<view v-for="item in assessmentList" :key="item.test_code" class="card" @click="startAssessment(item)">
					<view class="card-head">
						<image v-if="testImage(item.test_code)" class="test-cover" :src="testImage(item.test_code)" mode="aspectFill"></image>
						<text v-else class="test-emoji">{{ testEmoji(item.test_code) }}</text>
						<text class="card-title">{{ item.title || item.name }}</text>
						<text class="tag" v-if="item.completed">已完成</text>
					</view>
					<text class="card-sub">{{ item.description }}</text>
					<view class="card-foot">
						<text>{{ item.question_count || item.questionCount }} 道题</text>
						<text>{{ item.duration }}</text>
						<text class="start-text">开始测评 ›</text>
					</view>
				</view>
			</view>

			<button class="btn profile-entry" @click="goCareerProfile">✨ 查看我的综合职业画像</button>
			<button class="btn btn-outline" @click="loadAssessmentList" :disabled="listLoading">刷新测评列表</button>
			<view class="notice">说明：本题库为基础自我探索练习，不属于经过常模验证的标准化心理测量工具，结果仅供职业探索参考。</view>
		</view>

		<!-- 答题页 -->
		<view v-else-if="step === 2">
			<view class="title">{{ currentTest.title || currentTest.name }}</view>
			<view class="progress-row">
				<text>第 {{ currentIndex + 1 }} / {{ questions.length }} 题</text>
				<text>{{ Math.round((answeredCount / questions.length) * 100) }}%</text>
			</view>
			<view class="progress-track">
				<view class="progress-inner" :style="{ width: (answeredCount / questions.length * 100) + '%' }">
				</view>
			</view>

			<view v-if="currentQuestion" class="question-card">
				<view class="question-text">{{ currentQuestion.title || currentQuestion.question }}</view>
				<view v-for="(option, index) in currentQuestion.options" :key="String(option.value)" class="option-item"
					:class="{ active: String(userAnswers[currentQuestion.question_id]) === String(option.value) }"
					@click="selectOption(option.value)">
					<text class="option-index">{{ optionLetter(index) }}</text>
					<text class="option-label">{{ option.label || option.text || option.value }}</text>
				</view>
			</view>

			<view class="nav-row">
				<button class="btn btn-light" :disabled="currentIndex === 0 || submitting"
					@click="previousQuestion">上一题</button>
				<button class="btn" :disabled="!hasCurrentAnswer || submitting" @click="nextQuestion">
					{{ currentIndex === questions.length - 1 ? (submitting ? '提交中...' : '提交测评') : '下一题' }}
				</button>
			</view>
			<view class="hint">已完成 {{ answeredCount }} / {{ questions.length }} 题</view>
		</view>

		<!-- 结果页 -->
		<view v-else-if="step === 3">
			<view class="title">测评完成</view>
			<view class="result-card">
				<text class="result-label">{{ report.title || currentTest.title || currentTest.name }}</text>
				<view class="result-main">{{ mainResult }}</view>
				<text v-if="report.score !== undefined" class="score-desc">综合得分：{{ report.score }} 分</text>
				<text class="result-summary">{{ report.summary || report.description }}</text>
			</view>

			<view v-if="report.dimensions && !Array.isArray(report.dimensions)" class="section-card">
				<view class="section-title">性格偏好维度</view>
				<view v-for="(item, key) in report.dimensions" :key="key" class="dimension-row">
					<text class="dimension-name">{{ dimensionLabel(key) }}</text>
					<text class="dimension-value">{{ item.preference || '' }}</text>
					<text
						class="dimension-detail">{{ item.first_percent !== undefined ? item.first_percent + '% / ' + item.second_percent + '%' : '' }}</text>
				</view>
			</view>

			<view v-if="report.ranking && report.ranking.length" class="section-card">
				<view class="section-title">维度排序</view>
				<view v-for="(item, index) in report.ranking" :key="item.code" class="ranking-row">
					<text class="rank-number">{{ index + 1 }}</text>
					<text class="rank-name">{{ item.name || item.code }}</text>
					<text class="rank-score">{{ item.average !== undefined ? item.average : item.score }}</text>
				</view>
			</view>

			<view v-if="report.dimensions && Array.isArray(report.dimensions)" class="section-card">
				<view class="section-title">能力维度表现</view>
				<view v-for="item in report.dimensions" :key="item.code" class="dimension-row">
					<text class="dimension-name">{{ item.name }}</text>
					<text
						class="dimension-detail">{{ item.correct !== undefined ? item.correct + '/' + item.total + '题' : '' }}</text>
					<text
						class="dimension-value">{{ item.rate !== undefined ? item.rate + '%' : item.score + '分' }}</text>
				</view>
			</view>

			<view v-if="wrongQuestions.length" class="wrong-area">
				<view class="section-title">错题诊断（{{ wrongQuestions.length }}题）</view>
				<view v-for="(item, index) in wrongQuestions" :key="item.question_id || index" class="wrong-card">
					<view class="wrong-q">{{ index + 1 }}. {{ item.title }}</view>
					<view class="wrong-a">你的选择：<text class="text-red">{{ item.userAnswer }}</text></view>
					<view class="wrong-a">参考答案：<text class="text-green">{{ item.correctAnswer }}</text></view>
					<view v-if="item.explanation" class="explanation-box">
						<text class="explain-icon">题目解析：</text>
						<text>{{ item.explanation }}</text>
					</view>
					<button v-if="!item.aiExplanation" class="ai-btn" :disabled="item.loading"
						@click="getAIExplanation(item, index)">
						{{ item.loading ? 'AI正在分析...' : '✨ AI帮我解析' }}
					</button>
					<view v-if="item.aiExplanation" class="explanation-box">
						<text class="explain-icon">🤖 AI解析：</text>
						<text>{{ item.aiExplanation }}</text>
					</view>
				</view>
			</view>

			<button class="btn" @click="goGrowthWithRadar">返回成长页查看能力雷达</button>
			<button class="btn profile-entry" @click="goCareerProfile">✨ 查看综合职业画像</button>
			<button class="btn btn-outline" @click="resetAssessment">返回测评首页</button>
			<button class="btn btn-outline" @click="goHome">返回首页</button>
			<button class="btn btn-outline" @click="viewHistory">查看测评历史</button>
		</view>

		<!-- 历史记录 -->
		<view v-else-if="step === 4">
			<view class="title">测评历史</view>
			<view v-if="!history.length" class="hint">暂时没有测评记录</view>
			<view v-for="(item, index) in history" :key="item._id || index" class="card">
				<text class="card-title">{{ testName(item.test_code) }}</text>
				<text class="card-sub">{{ formatTime(item.created_at) }}</text>
				<text class="card-sub">{{ item.report && item.report.summary ? item.report.summary : '' }}</text>
			</view>
			<button class="btn profile-entry" @click="goCareerProfile">✨ 查看综合职业画像</button>
			<button class="btn btn-outline" @click="step = 1">返回测评首页</button>
			<button class="btn btn-outline" @click="goHome">返回首页</button>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		computed,
		onMounted
	} from 'vue'


	function goCareerProfile() {
		if (!getToken()) {
			showMessage('请先登录')
			return
		}
		uni.navigateTo({
			url: '/pages/assessment/career-profile'
		})
	}

	function goHome() {
		uni.switchTab({
			url: '/pages/index/index'
		})
	}

	function goGrowthWithRadar() {
		uni.navigateTo({
			url: '/pages/growth/record'
		})
	}

	const careerService = uniCloud.importObject('career-service')
	const aiService = uniCloud.importObject('ai-service')

	const step = ref(1)
	const assessmentList = ref([])
	const listLoading = ref(false)
	const currentTest = ref({})
	const questions = ref([])
	const currentIndex = ref(0)
	const userAnswers = ref({})
	const report = ref({})
	const wrongQuestions = ref([])
	const submitting = ref(false)
	const history = ref([])

	const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
	const hasCurrentAnswer = computed(() => {
		const q = currentQuestion.value
		return !!q && userAnswers.value[q.question_id] !== undefined
	})
	const answeredCount = computed(() => Object.keys(userAnswers.value).length)
	const mainResult = computed(() => {
		if (report.value.type) return report.value.type
		if (report.value.code) return report.value.code
		if (report.value.score !== undefined) return report.value.score + '分'
		if (report.value.ranking && report.value.ranking.length) {
			return report.value.ranking.slice(0, 3).map(x => x.name).join('、')
		}
		return '已生成测评报告'
	})

	
	function getToken() {
	    return uni.getStorageSync('token') || ''
	}


	function showMessage(message) {
		uni.showToast({
			title: message || '操作失败',
			icon: 'none'
		})
	}

	async function loadAssessmentList() {
		const token = getToken()
		if (!token) {
			showMessage('请先登录后再进行测评')
			return
		}
		listLoading.value = true
		try {
			const res = await careerService.getAssessmentList(token)
			if (res && res.code === 0) {
				assessmentList.value = res.data || []
			} else {
				showMessage(
				    res && (res.message || res.msg)
				        ? (res.message || res.msg)
				        : '测评列表加载失败'
				)
			}
		} catch (e) {
			console.error('getAssessmentList error:', e)
			showMessage('测评列表加载失败，请检查网络或登录状态')
		} finally {
			listLoading.value = false
		}
	}

	async function startAssessment(item) {
		if (!getToken()) {
			showMessage('请先登录')
			return
		}
		currentTest.value = item
		uni.showLoading({
			title: '加载题目...'
		})
		try {
			const res = await careerService.getAssessmentQuestions(item.test_code, getToken())
			if (!res || res.code !== 0) {
				showMessage(res && res.message ? res.message : '题目加载失败')
				return
			}
			const data = res.data || {}
			questions.value = Array.isArray(data.questions) ? data.questions : (Array.isArray(data) ? data : [])
			if (!questions.value.length) {
				showMessage('该测评暂时没有题目')
				return
			}
			currentIndex.value = 0
			userAnswers.value = {}
			report.value = {}
			wrongQuestions.value = []
			step.value = 2
		} catch (e) {
			console.error('getAssessmentQuestions error:', e)
			showMessage('题目加载失败')
		} finally {
			uni.hideLoading()
		}
	}

	function selectOption(value) {
		const q = currentQuestion.value
		if (!q) return
		// 整体替换对象，确保小程序端动态新增属性能触发响应式更新，
		// 否则最后一题选中后 hasCurrentAnswer 不刷新，提交按钮一直禁用。
		userAnswers.value = {
			...userAnswers.value,
			[q.question_id]: value
		}
	}

	function optionLetter(index) {
		return ['A', 'B', 'C', 'D', 'E'][index] || String(index + 1)
	}

	// 各测评类型的插画（static/assessment 内的原图，不重复）
	function testImage(code) {
		const map = {
			mbti: '/static/assessment/mbti.jpg',       // MBTI 16 型人物插画
			holland: '/static/assessment/riasec.jpg',  // RIASEC 霍兰德六型
			ability: '/static/assessment/domain.jpg',  // 五大能力倾向领域
			value: '/static/assessment/career.jpg'     // 工作价值观
		}
		return map[code] || ''
	}

	// 图片缺失时的 emoji 兜底
	function testEmoji(code) {
		const map = {
			mbti: '🧩',
			holland: '🧭',
			ability: '💡',
			value: '💎'
		}
		return map[code] || '📝'
	}

	function previousQuestion() {
		if (currentIndex.value > 0) currentIndex.value--
	}

	async function nextQuestion() {
		if (!hasCurrentAnswer.value) {
			showMessage('请选择一个答案')
			return
		}
		if (currentIndex.value < questions.value.length - 1) {
			currentIndex.value++
			return
		}
		await submitResult()
	}

	async function submitResult() {
		// 逐题校验，避免仅依赖对象 key 数量导致漏判
		const firstUnanswered = questions.value.find(
			q => userAnswers.value[q.question_id] === undefined
		)
		if (firstUnanswered) {
			const idx = questions.value.findIndex(
				q => q.question_id === firstUnanswered.question_id
			)
			currentIndex.value = idx
			showMessage('还有题目未作答，已为你定位')
			return
		}
		submitting.value = true
		uni.showLoading({
			title: '正在计算测评结果...'
		})
		try {
			const answers = questions.value.map(q => ({
				question_id: q.question_id,
				answer: userAnswers.value[q.question_id]
			}))
			const res = await careerService.submitNewAssessment({
				testCode: currentTest.value.test_code,
				answers,
				token: getToken()
			})
			if (!res || res.code !== 0) {
				showMessage(res && res.message ? res.message : '提交失败')
				return
			}
			report.value = (res.data && res.data.report) || {}
			buildWrongQuestions()
			step.value = 3
			await loadAssessmentList()
		} catch (e) {
			console.error('submitNewAssessment error:', e)
			showMessage('提交失败，请稍后重试')
		} finally {
			submitting.value = false
			uni.hideLoading()
		}
	}

	function buildWrongQuestions() {
		wrongQuestions.value = []
		if (currentTest.value.test_code !== 'ability') return
		const details = report.value.answer_details || []
		wrongQuestions.value = details.filter(item => !item.correct).map(item => ({
			...item,
			userAnswer: item.user_answer_label || item.user_answer,
			correctAnswer: item.correct_answer_label || item.correct_answer,
			explanation: item.explanation || '',
			aiExplanation: '',
			loading: false
		}))
	}

	async function getAIExplanation(item, index) {
		if (item.loading) return
		item.loading = true
		try {
			const res = await aiService.explainQuestion({
				question: item.title,
				userAnswer: item.userAnswer,
				correctAnswer: item.correctAnswer,
				explanation: item.explanation || ''
			})
			if (res && res.code === 0) {
				wrongQuestions.value[index].aiExplanation =
					typeof res.data === 'string' ? res.data : (res.data && (res.data.explanation || res.data
					.content)) || 'AI暂未返回解析内容'
			} else {
				showMessage(res && res.message ? res.message : 'AI解析失败')
			}
		} catch (e) {
			console.error('explainQuestion error:', e)
			showMessage('AI解析失败，请稍后重试')
		} finally {
			item.loading = false
		}
	}

	function resetAssessment() {
		step.value = 1
		currentIndex.value = 0
		questions.value = []
		userAnswers.value = {}
		report.value = {}
		wrongQuestions.value = []
		loadAssessmentList()
	}

	async function viewHistory() {
		try {
			const res = await careerService.getAssessmentHistory(getToken())
			if (res && res.code === 0) {
				history.value = res.data.records || res.data || []
				step.value = 4
			} else {
				showMessage(res && res.message ? res.message : '获取历史失败')
			}
		} catch (e) {
			console.error(e)
			showMessage('获取历史失败')
		}
	}

	function testName(code) {
		const item = assessmentList.value.find(x => x.test_code === code)
		return item ? (item.title || item.name) : code
	}

	function formatTime(value) {
		if (!value) return ''
		const d = new Date(value)
		const pad = n => String(n).padStart(2, '0')
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
	}

	function dimensionLabel(key) {
		const map = {
			EI: '外向 / 内向',
			SN: '实感 / 直觉',
			TF: '思考 / 情感',
			JP: '判断 / 知觉'
		}
		return map[key] || key
	}

	onMounted(loadAssessmentList)
</script>

<style scoped>
	.container {
		padding: 0 18px 40px;
		min-height: 100vh;
		box-sizing: border-box;
	}

	.title {
		font-size: 22px;
		font-weight: 800;
		color: #7A3E12;
		margin: 8px 0 10px;
	}

	.desc,
	.hint {
		color: #A08C77;
		font-size: 13px;
		line-height: 1.7;
		margin-bottom: 18px;
	}

	.card,
	.question-card,
	.result-card,
	.section-card,
	.wrong-card {
		background: #fff;
		border-radius: 18px;
		padding: 17px;
		margin-bottom: 14px;
		box-shadow: 0 8px 22px rgba(255, 138, 61, .10);
		border: 1px solid rgba(255, 193, 92, .22);
	}

	.test-cover {
		width: 64px;
		height: 64px;
		flex-shrink: 0;
		margin-right: 12px;
		border-radius: 14px;
		background: #FFF3DC;
	}

	.test-emoji {
		font-size: 24px;
		margin-right: 10px;
	}

	.card-head,
	.card-foot,
	.progress-row,
	.nav-row,
	.dimension-row,
	.ranking-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-title {
		flex: 1;
		display: block;
		font-size: 16px;
		font-weight: 800;
		color: #5A4633;
	}

	.card-sub {
		display: block;
		font-size: 12px;
		color: #8792a3;
		margin-top: 8px;
		line-height: 1.6;
	}

	.card-foot {
		margin-top: 15px;
		font-size: 12px;
		color: #8b96a6;
	}

	.start-text {
		color: #3277dc;
		font-weight: 600;
	}

	.tag {
		font-size: 11px;
		color: #27845b;
		background: #e9f7ef;
		padding: 4px 8px;
		border-radius: 10px;
	}

	.btn {
		background: #EF7A2A;
		color: #fff;
		border: 0;
		border-radius: 8px;
		font-size: 14px;
		margin: 12px 0 0;
	}

	.btn::after,
	.ai-btn::after {
		border: 0;
	}

	.btn-outline {
		color: #EF7A2A;
		background: #fff;
		border: 1px solid #EF7A2A;
	}

	.profile-entry {
		background: linear-gradient(135deg, #7c3aed, #a855f7);
		color: #fff;
	}

	.btn-light {
		color: #526174;
		background: #FFF6E8;
	}

	.notice {
		color: #9aa3b1;
		font-size: 11px;
		line-height: 1.7;
		margin-top: 18px;
	}

	.progress-row {
		color: #68768a;
		font-size: 13px;
		margin: 18px 0 8px;
	}

	.progress-track {
		height: 6px;
		background: #e6ebf2;
		border-radius: 8px;
		overflow: hidden;
		margin-bottom: 18px;
	}

	.progress-inner {
		height: 100%;
		background: #EF7A2A;
		border-radius: 8px;
	}

	.question-text {
		font-size: 17px;
		color: #253247;
		line-height: 1.7;
		font-weight: 600;
		margin-bottom: 20px;
	}

	.option-item {
		display: flex;
		align-items: flex-start;
		padding: 13px;
		border: 1px solid #e5eaf1;
		border-radius: 9px;
		margin-bottom: 10px;
		color: #465469;
		font-size: 14px;
		line-height: 1.5;
	}

	.option-item.active {
		border-color: #EF7A2A;
		background: #FFF6E8;
		color: #2868c5;
	}

	.option-index {
		width: 23px;
		height: 23px;
		line-height: 23px;
		text-align: center;
		background: #FFF8EE;
		border-radius: 50%;
		margin-right: 10px;
		flex-shrink: 0;
		font-size: 12px;
	}

	.option-item.active .option-index {
		color: #fff;
		background: #EF7A2A;
	}

	.nav-row {
		gap: 12px;
	}

	.nav-row .btn {
		flex: 1;
	}

	.result-card {
		text-align: center;
		padding: 25px 18px;
	}

	.result-label {
		display: block;
		color: #778295;
		font-size: 13px;
	}

	.result-main {
		color: #EF7A2A;
		font-size: 30px;
		font-weight: 800;
		margin: 15px 0;
	}

	.score-desc {
		color: #6f7d91;
		font-size: 13px;
	}

	.result-summary {
		display: block;
		text-align: left;
		color: #68768a;
		font-size: 13px;
		line-height: 1.8;
		margin-top: 16px;
	}

	.section-title {
		color: #27364b;
		font-size: 15px;
		font-weight: 700;
		margin-bottom: 14px;
	}

	.dimension-row,
	.ranking-row {
		padding: 10px 0;
		border-bottom: 1px solid #FFF8EE;
		font-size: 13px;
	}

	.dimension-name,
	.rank-name {
		color: #536176;
		flex: 1;
	}

	.dimension-value,
	.rank-score {
		color: #EF7A2A;
		font-weight: 700;
	}

	.dimension-detail {
		color: #8b96a6;
		margin-left: 10px;
	}

	.rank-number {
		width: 22px;
		color: #EF7A2A;
		font-weight: 700;
	}

	.wrong-card {
		border-left: 3px solid #e56b6b;
	}

	.wrong-q {
		color: #344258;
		font-size: 14px;
		line-height: 1.6;
		font-weight: 600;
		margin-bottom: 10px;
	}

	.wrong-a {
		color: #6d7889;
		font-size: 13px;
		margin: 6px 0;
	}

	.text-red {
		color: #d9534f;
		font-weight: 600;
	}

	.text-green {
		color: #26945f;
		font-weight: 600;
	}

	.ai-btn {
		color: #EF7A2A;
		background: #FFF6E8;
		border: 1px solid #cfe0fb;
		border-radius: 7px;
		font-size: 12px;
		margin: 12px 0 0;
	}

	.explanation-box {
		color: #5f6d80;
		background: #FFF6E8;
		padding: 11px;
		border-radius: 7px;
		font-size: 12px;
		line-height: 1.7;
		margin-top: 10px;
	}

	.explain-icon {
		color: #EF7A2A;
		font-weight: 700;
	}
</style>