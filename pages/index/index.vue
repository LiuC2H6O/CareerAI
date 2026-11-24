<template>
	<view class="page-bg">
		<!-- 顶部插画主视觉 -->
		<view class="hero">
			<image class="hero-art" src="/static/illustrations/home-hero.png" mode="aspectFill"></image>
			<view class="hero-overlay"></view>
			<view class="hero-content">
				<view class="greeting">
					<text class="hello">你好，未来的职场新星 ✨</text>
					<text class="date">{{ currentDate }} · 今天也要闪闪发光</text>
				</view>
				<view class="avatar-btn" @click="goToProfile">
					<text v-if="!dashboard.profile">设</text>
					<text v-else>👤</text>
				</view>
			</view>
			<!-- 漂浮的星星装饰（童话感） -->
			<text class="sparkle s1">✦</text>
			<text class="sparkle s2">✧</text>
			<text class="sparkle s3">✦</text>
		</view>

		<!-- 个人档案提示卡片 -->
		<view class="profile-alert fairy-card" v-if="!dashboard.profile" @click="goToProfile">
			<text class="alert-emoji">🎒</text>
			<view class="alert-text-wrap">
				<text class="alert-text">完善你的职业档案</text>
				<text class="alert-sub">解锁更精准的岗位推荐</text>
			</view>
			<view class="alert-btn">去完善 ›</view>
		</view>

		<!-- 数据面板 -->
		<view class="data-board">
			<view class="board-deco board-deco-1"></view>
			<view class="board-deco board-deco-2"></view>
			<view class="board-title">
				<text class="board-title-icon">🚀</text>
				<text>我的职场进度</text>
			</view>
			<view class="data-row">
				<view class="data-item">
					<text class="data-num">{{ dashboard.assessmentCount }}</text>
					<text class="data-label">测评次数</text>
				</view>
				<view class="divider"></view>
				<view class="data-item">
					<text class="data-num">{{ dashboard.aiCount }}</text>
					<text class="data-label">AI 辅导</text>
				</view>
				<view class="divider"></view>
				<view class="data-item">
					<text class="data-num data-num-text">{{ dashboard.profile ? dashboard.profile.major : '--' }}</text>
					<text class="data-label">所属专业</text>
				</view>
			</view>
		</view>

		<!-- 核心操作矩阵（每个入口单图标，点击态只在底部 tabBar 区分） -->
		<view class="section-head">
			<text class="section-emoji">🧭</text>
			<text class="section-title">探索之旅</text>
			<text class="section-sub">选择你的下一步</text>
		</view>

		<view class="action-grid">
			<view
				v-for="item in actionList"
				:key="item.key"
				class="action-card fairy-card"
				:class="item.theme"
				@click="onActionTap(item)"
			>
				<!-- 图标位：有图片路径显示 image，否则显示 emoji 兜底 -->
				<view class="icon-holder">
					<image
						v-if="item.icon"
						class="action-icon-img"
						:src="item.icon"
						mode="aspectFit"
					></image>
					<text v-else class="action-icon-emoji">{{ item.emoji }}</text>
				</view>
				<text class="action-name">{{ item.title }}</text>
				<text class="action-desc">{{ item.desc }}</text>
				<text class="action-arrow">›</text>
			</view>
		</view>

		<!-- 优势能力 -->
		<view class="section-head" v-if="dashboard.topSkills.length > 0">
			<text class="section-emoji">🌟</text>
			<text class="section-title">我的优势能力</text>
		</view>
		<view class="skill-list fairy-card" v-if="dashboard.topSkills.length > 0">
			<view class="skill-item" v-for="skill in dashboard.topSkills" :key="skill._id">
				<view class="skill-icon-dot"></view>
				<text class="skill-name">{{ getSkillName(skill.skill_code) }}</text>
				<view class="skill-bar-bg">
					<view class="skill-bar-fill" :style="{ width: skill.score + '%' }"></view>
				</view>
				<text class="skill-score">{{ skill.score }}</text>
			</view>
		</view>
		<view class="empty-skill fairy-card" v-else @click="goToAssessment">
			<text class="empty-emoji">🌱</text>
			<text>还没有能力数据，快去完成一次「能力测评」吧！</text>
		</view>

		<view style="height: 40px;"></view>
	</view>
</template>

<script setup>
	import {
		ref,
		computed
	} from 'vue'
	import {
		onShow
	} from '@dcloudio/uni-app'

	const careerService = uniCloud.importObject('career-service')
	const dashboard = ref({
		profile: null,
		assessmentCount: 0,
		aiCount: 0,
		topSkills: []
	})

	const currentDate = ref('')

	/*
	 * ============================================================
	 * 功能入口 · 单图标配置区
	 * ------------------------------------------------------------
	 * 首页四个功能入口只保留一个默认图标（点击态区分只在底部 tabBar）：
	 *   icon  = 默认图标路径
	 *   emoji = 图片缺失时的兜底 emoji
	 *
	 * 已按你指定的原始文件精确接入（复制到 static/icons/ 后引用）：
	 *   assessment  → static/测评/预测评估.png       (home-assessment.png)
	 *   match       → static/首页/岗位匹配.png       (home-match.png)
	 *   resume      → static/首页/简历诊断.png       (home-resume.png)
	 *   interview   → static/首页/模拟面试 (2).png   (home-interview.png)
	 * 如需替换，把图片放进 static/icons/ 后改这里的路径即可；
	 * 留空（''）会自动用 emoji 兜底。
	 * ============================================================
	 */
	const actionList = ref([
		{
			key: 'assessment',
			title: '能力测评',
			desc: '发现你的隐藏天赋',
			theme: 'theme-orange',
			icon: '/static/icons/home-assessment.png',   // 测评/预测评估.png（彩色趋势图）
			emoji: '📝',
			handler: 'goToAssessment'
		},
		{
			key: 'match',
			title: '岗位匹配',
			desc: '找到与你契合的方向',
			theme: 'theme-amber',
			icon: '/static/icons/home-match.png',   // 首页/岗位匹配.png
			emoji: '🎯',
			handler: 'goToJobs'
		},
		{
			key: 'resume',
			title: '简历诊断',
			desc: '让简历更出彩',
			theme: 'theme-coral',
			icon: '/static/icons/home-resume.png',       // 首页/简历诊断.png
			emoji: '✨',
			handler: 'goToResume'
		},
		{
			key: 'interview',
			title: '模拟面试',
			desc: '从容应对每一次考验',
			theme: 'theme-yellow',
			icon: '/static/icons/home-interview.png',    // 首页/模拟面试 (2).png
			emoji: '🗣️',
			handler: 'goToInterview'
		}
	])

	const initDate = () => {
		const d = new Date()
		currentDate.value = `${d.getMonth() + 1}月${d.getDate()}日`
	}

	const getSkillName = (code) => {
		const map = {
			'logic': '逻辑思维',
			'professional': '专业基础',
			'communication': '沟通表达',
			'digital': '数字技能',
			'practice': '实践能力',
			'career': '求职能力'
		}
		return map[code] || code
	}

	const loadData = async () => {
		const token = uni.getStorageSync('token') || ''
		if (!token) return
		try {
			const res = await careerService.getDashboardData(token)
			if (res.code === 0) {
				dashboard.value = res.data
			}
		} catch (e) {
			console.error('获取首页数据失败', e)
		}
	}

	onShow(() => {
		const user = uni.getStorageSync('currentUser')
		if (!user) {
			uni.navigateTo({ url: '/pages/login/log' })
			return
		}
		initDate()
		loadData()
	})

	// 点击入口：直接跳转（无点击后图标状态）
	const onActionTap = (item) => {
		handlers[item.handler] && handlers[item.handler]()
	}

	const goToProfile = () => {
		uni.switchTab({ url: '/pages/career/explore' })
	}
	const goToAssessment = () => {
		uni.switchTab({ url: '/pages/assessment/index' })
	}
	const goToJobs = () => {
		uni.navigateTo({ url: '/pages/career/jobs' })
	}
	const goToResume = () => {
		uni.navigateTo({ url: '/pages/coach/resume' })
	}
	const goToInterview = () => {
		uni.navigateTo({ url: '/pages/coach/interview' })
	}

	const handlers = {
		goToAssessment,
		goToJobs,
		goToResume,
		goToInterview
	}
</script>

<style scoped>
	/* 页面底色：奶油白渐变 */
	.page-bg {
		min-height: 100vh;
		padding: 0 20px 20px;
		box-sizing: border-box;
		background:
			radial-gradient(circle at 90% 2%, rgba(255, 209, 92, .35), transparent 42%),
			radial-gradient(circle at 5% 30%, rgba(255, 138, 61, .12), transparent 40%),
			linear-gradient(180deg, #FFF4E2 0%, #FFF8EE 260px, #FFF8EE 100%);
	}

	/* ============ 顶部插画主视觉 ============ */
	.hero {
		position: relative;
		height: 200px;
		margin: 0 -20px 18px;
		overflow: hidden;
		border-bottom-left-radius: 32px;
		border-bottom-right-radius: 32px;
	}

	.hero-art {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	/* 左侧渐白遮罩，保证问候文字清晰 */
	.hero-overlay {
		position: absolute;
		left: 0;
		top: 0;
		width: 62%;
		height: 100%;
		background: linear-gradient(90deg, rgba(255, 248, 238, .96) 0%, rgba(255, 248, 238, .78) 55%, transparent 100%);
	}

	.hero-content {
		position: relative;
		z-index: 2;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 26px 22px 0;
	}

	.greeting .hello {
		font-size: 21px;
		font-weight: 800;
		color: #7A3E12;
		display: block;
		margin-bottom: 8px;
		letter-spacing: .5px;
	}

	.greeting .date {
		font-size: 12px;
		color: #A08C77;
		display: block;
	}

	.avatar-btn {
		width: 46px;
		height: 46px;
		border-radius: 50%;
		background: rgba(255, 255, 255, .9);
		border: 2px solid #FFD15C;
		box-shadow: 0 6px 16px rgba(255, 138, 61, .22);
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 18px;
		color: #FF8A3D;
		font-weight: 700;
	}

	.sparkle {
		position: absolute;
		z-index: 3;
		color: #FFB13C;
		opacity: .85;
	}

	.s1 { left: 44%; top: 28px; font-size: 16px; }
	.s2 { left: 54%; top: 120px; font-size: 13px; color: #FF8A3D; }
	.s3 { right: 16px; top: 22px; font-size: 14px; }

	/* ============ 档案提示 ============ */
	.profile-alert {
		display: flex;
		align-items: center;
		padding: 14px 16px;
		margin-bottom: 16px;
		background: linear-gradient(135deg, #FFF3DC 0%, #FFEBD2 100%);
		border-color: rgba(255, 177, 60, .4);
	}

	.alert-emoji {
		font-size: 30px;
		margin-right: 12px;
	}

	.alert-text-wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.alert-text {
		font-size: 14px;
		color: #7A3E12;
		font-weight: 700;
	}

	.alert-sub {
		font-size: 11px;
		color: #B08A63;
		margin-top: 3px;
	}

	.alert-btn {
		font-size: 12px;
		background: linear-gradient(135deg, #FF9A3C, #FFB13C);
		color: #fff;
		padding: 7px 14px;
		border-radius: 999px;
		font-weight: 600;
	}

	/* ============ 数据面板 ============ */
	.data-board {
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, #FF9A3C 0%, #FF7A45 55%, #FFB13C 100%);
		border-radius: 24px;
		padding: 22px 20px;
		box-shadow: 0 12px 26px rgba(255, 122, 69, .30);
		margin-bottom: 26px;
		color: #fff;
	}

	.board-deco {
		position: absolute;
		border: 2px solid rgba(255, 255, 255, .18);
		border-radius: 50%;
	}

	.board-deco-1 { width: 150px; height: 150px; right: -40px; top: -50px; }
	.board-deco-2 { width: 90px; height: 90px; right: 30px; bottom: -46px; }

	.board-title {
		position: relative;
		font-size: 14px;
		color: rgba(255, 255, 255, .95);
		margin-bottom: 18px;
		font-weight: 600;
		display: flex;
		align-items: center;
	}

	.board-title-icon { font-size: 17px; margin-right: 6px; }

	.data-row {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.data-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.data-num {
		font-size: 26px;
		font-weight: 800;
		margin-bottom: 5px;
		line-height: 1.2;
	}

	.data-num-text { font-size: 15px; max-width: 96px; text-align: center; }

	.data-label {
		font-size: 11px;
		color: rgba(255, 255, 255, .82);
	}

	.divider {
		width: 1px;
		height: 32px;
		background: rgba(255, 255, 255, .28);
	}

	/* ============ 模块标题 ============ */
	.section-head {
		display: flex;
		align-items: baseline;
		margin-bottom: 14px;
	}

	.section-emoji { font-size: 20px; margin-right: 8px; }

	.section-title {
		font-size: 18px;
		font-weight: 800;
		color: #7A3E12;
	}

	.section-sub {
		font-size: 11px;
		color: #B08A63;
		margin-left: auto;
	}

	/* ============ 功能入口矩阵 ============ */
	.action-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
		margin-bottom: 28px;
	}

	.action-card {
		position: relative;
		padding: 18px 16px 16px;
		min-height: 128px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		overflow: hidden;
		transition: transform .12s ease;
	}

	.action-card::after {
		content: '';
		position: absolute;
		right: -28px;
		bottom: -28px;
		width: 90px;
		height: 90px;
		border-radius: 50%;
		background: currentColor;
		opacity: .08;
	}

	.icon-holder {
		position: relative;
		width: 52px;
		height: 52px;
		margin-bottom: 12px;
		border-radius: 16px;
		background: #FFF6E8;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.action-icon-img {
		position: relative;
		z-index: 1;
		width: 40px;
		height: 40px;
	}

	.action-icon-emoji {
		position: relative;
		z-index: 1;
		font-size: 27px;
	}

	.action-name {
		font-size: 15px;
		font-weight: 800;
		color: #5A4633;
		margin-bottom: 4px;
	}

	.action-desc {
		font-size: 11px;
		color: #A08C77;
		line-height: 1.4;
		padding-right: 12px;
	}

	.action-arrow {
		position: absolute;
		right: 14px;
		top: 16px;
		font-size: 22px;
		color: currentColor;
		opacity: .55;
		font-weight: 700;
	}

	/* 每个入口的暖色主题 */
	.theme-orange { color: #FF8A3D; background: linear-gradient(135deg, #FFF6EC, #FFEAD8); }
	.theme-amber  { color: #F5A623; background: linear-gradient(135deg, #FFF9E8, #FFF0CC); }
	.theme-coral  { color: #FF7043; background: linear-gradient(135deg, #FFF1EC, #FFE0D4); }
	.theme-yellow { color: #ECAE1D; background: linear-gradient(135deg, #FFFAEA, #FFF3D0); }

	/* ============ 优势能力 ============ */
	.skill-list { padding: 18px 16px; }

	.skill-item {
		display: flex;
		align-items: center;
		margin-bottom: 15px;
	}

	.skill-item:last-child { margin-bottom: 0; }

	.skill-icon-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: linear-gradient(135deg, #FFB13C, #FF8A3D);
		margin-right: 10px;
		flex-shrink: 0;
	}

	.skill-name {
		width: 64px;
		font-size: 13px;
		color: #5A4633;
		flex-shrink: 0;
	}

	.skill-bar-bg {
		flex: 1;
		height: 9px;
		background: #FFF0DC;
		border-radius: 6px;
		margin: 0 12px;
		overflow: hidden;
	}

	.skill-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #FFD15C, #FF9A3C);
		border-radius: 6px;
	}

	.skill-score {
		width: 30px;
		font-size: 14px;
		font-weight: 800;
		color: #FF8A3D;
		text-align: right;
	}

	.empty-skill {
		padding: 28px 18px;
		text-align: center;
		color: #A08C77;
		font-size: 13px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.empty-emoji { font-size: 34px; margin-bottom: 10px; }
</style>
