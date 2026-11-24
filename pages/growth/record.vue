<template>
	<view class="container fairy-page">
		<view class="ip-hero t-coral">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s2">✧</text>
			<view class="ip-hero-row">
				<image class="ip-hero-icon" src="/static/icons/report.png" mode="aspectFit"></image>
				<view>
					<text class="ip-hero-title">我的成长档案</text>
					<text class="ip-hero-sub">记录你的每一次进步</text>
				</view>
			</view>
		</view>

		<!-- 1. 能力模型展示区 (包含雷达图) -->
		<view class="card">
			<view class="card-title">能力雷达</view>

			<!-- Canvas 画布 -->
			<view class="radar-container">
				<canvas canvas-id="radarCanvas" id="radarCanvas" class="radar-canvas"
					style="width: 300px; height: 300px;"></canvas>
			</view>

			<!-- 文字明细 -->
			<view v-if="skills.length > 0" style="margin-top: 15px;">
				<view v-for="skill in skills" :key="skill._id" class="skill-row">
					<view class="skill-info">
						<text class="skill-name">{{ getSkillName(skill.skill_code) }}</text>
						<text class="skill-score">{{ skill.score }}分</text>
					</view>
				</view>
			</view>
			<view v-else class="empty-text">暂无能力数据，快去完成测评吧</view>
			<view class="radar-actions">
				<button class="mini-btn" @click="goCareerProfile">查看综合职业画像</button>
				<button class="mini-btn ghost" @click="goAssessment">去完成测评</button>
			</view>
		</view>

		<!-- 2. 近期动态（时间轴样式） -->
		<view class="card">
			<view class="card-title">近期动态</view>
			<view class="timeline">
				<view v-if="timelineList.length === 0" class="empty-text">暂无记录</view>
				<view v-for="(item, index) in timelineList" :key="index" class="timeline-item">
					<view class="dot"></view>
					<view class="time">{{ item.timeStr }}</view>
					<view class="content">
						<text class="type-tag" :class="item.type === 'ai' ? 'tag-ai' : 'tag-test'">
							{{ item.type === 'ai' ? 'AI辅导' : '能力测评' }}
						</text>
						<text class="desc">{{ item.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<button class="home-btn" @click="goHome">返回首页</button>
	</view>
</template>

<script setup>
	import {
		ref,
		computed,
		nextTick
	} from 'vue'
	import {
		onShow
	} from '@dcloudio/uni-app'

	const careerService = uniCloud.importObject('career-service')
	const skills = ref([])
	const rawAssessments = ref([])
	const rawAiRecords = ref([])

	// 映射能力代码到中文
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

	// 格式化时间戳
	const formatTime = (timestamp) => {
		const date = new Date(timestamp)
		const m = (date.getMonth() + 1).toString().padStart(2, '0')
		const d = date.getDate().toString().padStart(2, '0')
		const h = date.getHours().toString().padStart(2, '0')
		const min = date.getMinutes().toString().padStart(2, '0')
		return `${m}-${d} ${h}:${min}`
	}

	// 测评名称映射
	const TEST_NAMES = {
		mbti: '性格测评',
		holland: '兴趣测评',
		ability: '能力测评',
		value: '价值观测评'
	}

	// 合并并排序时间轴
	const timelineList = computed(() => {
		const list = []
		rawAssessments.value.forEach(item => {
			const code = item.test_code || item.category_code
			const name = TEST_NAMES[code] || item.test_name || getSkillName(code)
			const scoreText = item.score !== undefined && item.score !== null ?
				`，得分 ${item.score} 分` : ''
			list.push({
				type: 'test',
				timestamp: item.created_at,
				timeStr: formatTime(item.created_at),
				desc: `完成了【${name}】测评${scoreText}`
			})
		})
		rawAiRecords.value.forEach(item => {
			const typeNames = {
				resume_analysis: 'AI简历诊断',
				career_coach: 'AI职业教练',
				interview: 'AI模拟面试'
			}
			const name = typeNames[item.type] || 'AI辅导'
			const question = item.input_summary ?
				`：${item.input_summary}` : ''
			list.push({
				type: 'ai',
				timestamp: item.created_at,
				timeStr: formatTime(item.created_at),
				desc: `使用了【${name}】服务${question}`
			})
		})
		return list.sort((a, b) => b.timestamp - a.timestamp)
	})

	// --- 画雷达图的核心逻辑 ---
	const drawRadar = () => {
		const canvasWidth = 300
		const canvasHeight = 300
		const centerX = canvasWidth / 2
		const centerY = canvasHeight / 2
		const radius = 100 // 半径
		const sides = 6

		const categories = [{
				code: 'professional',
				name: '专业'
			},
			{
				code: 'logic',
				name: '逻辑'
			},
			{
				code: 'communication',
				name: '沟通'
			},
			{
				code: 'digital',
				name: '数字'
			},
			{
				code: 'practice',
				name: '实践'
			},
			{
				code: 'career',
				name: '求职'
			}
		]

		const ctx = uni.createCanvasContext('radarCanvas')

		// 1. 画背景网格
		const levels = 5
		for (let i = 1; i <= levels; i++) {
			ctx.beginPath()
			const currentRadius = radius * (i / levels)
			for (let j = 0; j < sides; j++) {
				const angle = (Math.PI * 2 / sides) * j - Math.PI / 2
				const x = centerX + currentRadius * Math.cos(angle)
				const y = centerY + currentRadius * Math.sin(angle)
				if (j === 0) ctx.moveTo(x, y)
				else ctx.lineTo(x, y)
			}
			ctx.closePath()
			ctx.setStrokeStyle('#E5E7EB')
			ctx.stroke()
		}

		// 2. 画连线
		for (let i = 0; i < sides; i++) {
			const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
			const x = centerX + radius * Math.cos(angle)
			const y = centerY + radius * Math.sin(angle)
			ctx.beginPath()
			ctx.moveTo(centerX, centerY)
			ctx.lineTo(x, y)
			ctx.setStrokeStyle('#E5E7EB')
			ctx.stroke()
		}

		// 3. 绘制用户数据区域
		const skillMap = {}
		skills.value.forEach(s => {
			skillMap[s.skill_code] = s.score
		})

		ctx.beginPath()
		for (let i = 0; i < sides; i++) {
			const category = categories[i]
			const score = skillMap[category.code] || 5 // 没数据的给个极小的基础值
			const currentRadius = radius * (score / 100)
			const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
			const x = centerX + currentRadius * Math.cos(angle)
			const y = centerY + currentRadius * Math.sin(angle)

			if (i === 0) ctx.moveTo(x, y)
			else ctx.lineTo(x, y)
		}
		ctx.closePath()
		ctx.setFillStyle('rgba(255, 154, 60, 0.38)')
		ctx.fill()
		ctx.setStrokeStyle('#EF7A2A')
		ctx.setLineWidth(2)
		ctx.stroke()

		// 4. 画外围文字
		ctx.setFontSize(12)
		ctx.setFillStyle('#666')
		ctx.setTextAlign('center')
		ctx.setTextBaseline('middle')
		for (let i = 0; i < sides; i++) {
			const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
			const textRadius = radius + 20
			const x = centerX + textRadius * Math.cos(angle)
			const y = centerY + textRadius * Math.sin(angle)
			ctx.fillText(categories[i].name, x, y)
		}

		ctx.draw()
	}

	const loadData = async () => {
		const token = uni.getStorageSync('token') || ''
		if (!token) {
			skills.value = []
			rawAssessments.value = []
			rawAiRecords.value = []
			uni.hideLoading()
			return
		}
		uni.showLoading({
			title: '加载中...'
		})
		try {
			// 传入 token：与写入测评时统一用户身份，否则云端按 uid 查不到数据
			const res = await careerService.getGrowthOverview(token)
			if (res.code === 0) {
				skills.value = res.data.skills || []
				rawAssessments.value = res.data.assessments || res.data.records || []
				rawAiRecords.value = res.data.aiRecords || []

				// 数据加载完后，延迟一下等待 DOM 渲染再画图
				nextTick(() => {
					setTimeout(() => {
						drawRadar()
					}, 100)
				})
			}
		} catch (e) {
			console.error(e)
		}
		uni.hideLoading()
	}

	const goCareerProfile = () => {
		uni.navigateTo({
			url: '/pages/assessment/career-profile'
		})
	}

	const goAssessment = () => {
		uni.switchTab({
			url: '/pages/assessment/index'
		})
	}

	const goHome = () => {
		uni.switchTab({
			url: '/pages/index/index'
		})
	}

	// 使用 onShow 确保每次进入页面数据都是最新的
	onShow(() => {
		loadData()
	})
</script>

<style scoped>
	.container {
		padding: 0 20px 30px;
		min-height: 100vh;
	}

	.card {
		background: #fff;
		border-radius: 18px;
		padding: 20px;
		margin-bottom: 20px;
		box-shadow: 0 8px 22px rgba(255, 138, 61, .10);
		border: 1px solid rgba(255, 193, 92, .22);
	}

	.card-title {
		font-size: 16px;
		font-weight: bold;
		margin-bottom: 15px;
		border-left: 4px solid #FF8A3D;
		padding-left: 10px;
	}

	.empty-text {
		font-size: 13px;
		color: #999;
		text-align: center;
		padding: 20px 0;
	}

	/* 雷达图容器 */
	.radar-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	/* 文字明细 */
	.skill-row {
		margin-bottom: 10px;
	}

	.skill-info {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
	}

	.skill-name {
		color: #333;
	}

	.skill-score {
		color: #FF8A3D;
		font-weight: bold;
	}

	/* 时间轴样式 */
	.timeline {
		padding-left: 10px;
		border-left: 2px solid #EBEBEB;
		margin-left: 5px;
	}

	.timeline-item {
		position: relative;
		margin-bottom: 20px;
		padding-left: 15px;
	}

	.timeline-item:last-child {
		margin-bottom: 0;
	}

	.dot {
		position: absolute;
		left: -17px;
		top: 4px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #FF8A3D;
		border: 2px solid #fff;
	}

	.time {
		font-size: 12px;
		color: #999;
		margin-bottom: 5px;
	}

	.content {
		background: #FFF6E8;
		padding: 10px;
		border-radius: 6px;
	}

	.type-tag {
		font-size: 11px;
		padding: 2px 6px;
		border-radius: 4px;
		margin-right: 8px;
	}

	.tag-ai {
		background: #FFF4E0;
		color: #FF8A3D;
	}

	.tag-test {
		background: #FFF3E0;
		color: #FF9500;
	}

	.desc {
		font-size: 14px;
		color: #333;
		line-height: 1.4;
	}

	/* 雷达图下方操作按钮 */
	.radar-actions {
		display: flex;
		gap: 10px;
		margin-top: 16px;
	}

	.mini-btn {
		flex: 1;
		font-size: 12px;
		height: 32px;
		line-height: 32px;
		padding: 0;
		background: #FF8A3D;
		color: #fff;
		border-radius: 6px;
	}

	.mini-btn::after,
	.home-btn::after {
		border: 0;
	}

	.mini-btn.ghost {
		background: #FFF6E8;
		color: #FF8A3D;
	}

	.home-btn {
		width: 100%;
		height: 42px;
		line-height: 42px;
		font-size: 14px;
		background: #fff;
		color: #FF8A3D;
		border: 1px solid #FF8A3D;
		border-radius: 10px;
		margin-top: 4px;
	}
</style>