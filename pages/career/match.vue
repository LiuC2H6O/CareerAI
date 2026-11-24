<template>
	<view class="container fairy-page">
		<!-- 加载中 -->
		<view v-if="loading" class="state-box">
			<text class="state-text">正在计算匹配度...</text>
		</view>

		<!-- 加载失败 / 无数据 -->
		<view v-else-if="loadError" class="state-box">
			<text class="state-icon">⚠️</text>
			<text class="state-text">{{ loadError }}</text>
			<button class="btn btn-primary" @click="retry">重新加载</button>
			<button class="btn btn-outline" @click="goJobs">返回岗位列表</button>
		</view>

		<!-- 匹配结果 -->
		<view v-else-if="matchData">
			<view class="header">
				<text class="job-name">{{ jobName }}</text>
				<text class="job-cat" v-if="jobCategory">{{ jobCategory }}</text>
				<text class="match-label">岗位匹配参考分</text>
				<view class="score-ring">
					<text class="match-score">{{ displayScore }}</text>
					<text class="score-unit">分</text>
				</view>
				<text class="match-level">{{ matchLevel }}</text>
			</view>

			<view class="warning" v-if="missingList.length > 0">
				⚠️ 你还有 {{ missingList.length }} 项能力维度暂无数据（{{ missingText }}），当前分数为已有数据的折算结果，建议完成对应测评。
			</view>

			<view class="card" v-if="detailList.length">
				<view class="card-title">能力对比明细</view>
				<view v-for="item in detailList" :key="item.skill_code" class="skill-item">
					<view class="skill-info">
						<text class="skill-name">{{ item.skill_name || skillName(item.skill_code) }}</text>
						<text class="skill-weight">权重 {{ weightPercent(item.weight) }}</text>
					</view>
					<view class="skill-bar-wrap">
						<view class="bar-bg">
							<view class="bar-fill" :style="{ width: barWidth(item) }"></view>
						</view>
						<text class="skill-score" :class="{ 'missing': item.status === 'missing' }">
							{{ item.status === 'missing' ? '暂无数据' : item.user_score + ' 分' }}
						</text>
					</view>
				</view>
			</view>

			<view class="card" v-if="jobDescription">
				<view class="card-title">岗位说明</view>
				<text class="job-desc">{{ jobDescription }}</text>
			</view>

			<view class="notice">* 匹配参考分由规则计算得出，不代表最终录用概率，请结合真实经历综合判断。</view>

			<button class="btn btn-primary" @click="goAssessment">去补充能力测评</button>
			<button class="btn btn-outline" @click="goJobs">返回岗位列表</button>
			<button class="btn btn-outline" @click="goHome">返回首页</button>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		computed
	} from 'vue'
	import {
		onLoad
	} from '@dcloudio/uni-app'

	const matchData = ref(null)
	const loading = ref(true)
	const loadError = ref('')
	const currentJobId = ref('')
	const careerService = uniCloud.importObject('career-service')

	const SKILL_NAMES = {
		logic: '逻辑思维',
		professional: '专业基础',
		communication: '沟通表达',
		digital: '数字技能',
		practice: '实践能力',
		career: '求职能力'
	}

	function skillName(code) {
		return SKILL_NAMES[code] || code
	}

	function weightPercent(weight) {
		const n = Number(weight) || 0
		return Math.round(n * 100) + '%'
	}

	function barWidth(item) {
		if (item.status === 'missing') return '0%'
		const n = Number(item.user_score) || 0
		return Math.max(0, Math.min(100, n)) + '%'
	}

	// 全部字段做驼峰/下划线双兼容，防止云端字段名变化导致再次白屏
	const jobName = computed(() => {
		const job = matchData.value && matchData.value.job
		if (!job) return '岗位匹配'
		return job.job_name || job.jobName || job.name || '岗位匹配'
	})

	const jobCategory = computed(() => {
		const job = matchData.value && matchData.value.job
		return job ? (job.job_category || job.jobCategory || '') : ''
	})

	const jobDescription = computed(() => {
		const job = matchData.value && matchData.value.job
		return job ? (job.description || job.desc || '') : ''
	})

	const displayScore = computed(() => {
		const d = matchData.value || {}
		const score = d.matchScore !== undefined
			? d.matchScore
			: (d.match_score !== undefined ? d.match_score : 0)
		return Number(score) || 0
	})

	const matchLevel = computed(() => {
		const d = matchData.value || {}
		if (d.level) return d.level
		const s = displayScore.value
		if (s >= 80) return '高度匹配'
		if (s >= 60) return '较为匹配'
		if (s >= 40) return '有一定匹配度'
		return '匹配度较低'
	})

	const detailList = computed(() => {
		const d = matchData.value || {}
		return Array.isArray(d.details) ? d.details : []
	})

	const missingList = computed(() => {
		const d = matchData.value || {}
		if (Array.isArray(d.missingSkills)) return d.missingSkills
		if (Array.isArray(d.missing_skills)) return d.missing_skills
		return []
	})

	const missingText = computed(() => {
		return missingList.value.map(code => skillName(code)).join('、')
	})

	onLoad((options) => {
		const jobId = options && (options.jobId || options.id)
		if (jobId) {
			currentJobId.value = jobId
			loadMatchData(jobId)
		} else {
			loading.value = false
			loadError.value = '缺少岗位参数，请从岗位列表进入'
		}
	})

	const loadMatchData = async (jobId) => {
		loading.value = true
		loadError.value = ''
		try {
			const res = await careerService.matchJob(jobId, uni.getStorageSync('token') || '')
			if (res && res.code === 0 && res.data) {
				matchData.value = res.data
			} else {
				loadError.value = (res && (res.message || res.msg)) || '匹配数据加载失败'
			}
		} catch (e) {
			console.error('matchJob error:', e)
			loadError.value = '匹配度计算失败，请稍后重试'
		} finally {
			loading.value = false
		}
	}

	function retry() {
		if (currentJobId.value) {
			loadMatchData(currentJobId.value)
		} else {
			goJobs()
		}
	}

	function goJobs() {
		uni.navigateTo({ url: '/pages/career/jobs' })
	}

	function goAssessment() {
		uni.switchTab({ url: '/pages/assessment/index' })
	}

	function goHome() {
		uni.switchTab({ url: '/pages/index/index' })
	}
</script>

<style scoped>
	.container {
		padding: 20px;
		min-height: 100vh;
		box-sizing: border-box;
	}

	.state-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 20px;
	}

	.state-icon {
		font-size: 36px;
		margin-bottom: 16px;
	}

	.state-text {
		font-size: 14px;
		color: #888;
		text-align: center;
		margin-bottom: 20px;
	}

	.header {
		background: #fff;
		border-radius: 12px;
		padding: 26px 20px;
		text-align: center;
		margin-bottom: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.job-name {
		font-size: 20px;
		font-weight: bold;
		color: #222;
		display: block;
		margin-bottom: 8px;
	}

	.job-cat {
		display: inline-block;
		font-size: 12px;
		color: #FF8A3D;
		background: #FFF4E0;
		padding: 3px 10px;
		border-radius: 12px;
		margin-bottom: 18px;
	}

	.match-label {
		font-size: 14px;
		color: #666;
		display: block;
		margin-bottom: 6px;
	}

	.score-ring {
		display: flex;
		align-items: baseline;
		justify-content: center;
	}

	.match-score {
		font-size: 52px;
		font-weight: bold;
		color: #FF8A3D;
		line-height: 1.1;
	}

	.score-unit {
		font-size: 16px;
		color: #FF8A3D;
		margin-left: 4px;
	}

	.match-level {
		display: inline-block;
		margin-top: 10px;
		font-size: 13px;
		color: #FF8A3D;
		background: #FFF4E0;
		padding: 4px 14px;
		border-radius: 14px;
	}

	.warning {
		background: #FFF3E0;
		color: #E65100;
		padding: 12px;
		border-radius: 8px;
		font-size: 13px;
		margin-bottom: 16px;
		line-height: 1.6;
	}

	.card {
		background: #fff;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.card-title {
		font-size: 16px;
		font-weight: bold;
		margin-bottom: 15px;
		border-left: 4px solid #FF8A3D;
		padding-left: 10px;
	}

	.skill-item {
		padding: 12px 0;
		border-bottom: 1px solid #FFF6E8;
	}

	.skill-item:last-child {
		border-bottom: none;
	}

	.skill-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.skill-name {
		font-size: 15px;
		color: #333;
	}

	.skill-weight {
		font-size: 12px;
		color: #999;
	}

	.skill-bar-wrap {
		display: flex;
		align-items: center;
	}

	.bar-bg {
		flex: 1;
		height: 8px;
		background: #FFF6E8;
		border-radius: 4px;
		overflow: hidden;
		margin-right: 12px;
	}

	.bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #FFB547, #EF7A2A);
		border-radius: 4px;
	}

	.skill-score {
		font-size: 13px;
		color: #FF8A3D;
		font-weight: bold;
		min-width: 76px;
		text-align: right;
	}

	.skill-score.missing {
		color: #999;
		font-weight: normal;
	}

	.job-desc {
		font-size: 14px;
		color: #666;
		line-height: 1.7;
	}

	.notice {
		font-size: 12px;
		color: #999;
		text-align: center;
		margin: 16px 0;
		line-height: 1.6;
	}

	.btn {
		border-radius: 8px;
		font-size: 14px;
		padding: 10px 0;
		margin-top: 10px;
	}

	.btn::after {
		border: 0;
	}

	.btn-primary {
		background: #FF8A3D;
		color: #fff;
	}

	.btn-outline {
		background: #fff;
		color: #FF8A3D;
		border: 1px solid #FF8A3D;
	}
</style>
