<template>
	<!-- 1. 能力模型展示区 -->
	<view class="card">
		<view class="card-title">能力雷达</view>

		<!-- 引入雷达图组件 -->
		<SkillRadar :skills="skills" />

		<!-- 保留下方的文字明细 -->
		<view style="margin-top: 15px;">
			<view v-for="skill in skills" :key="skill._id" class="skill-row">
				<view class="skill-info">
					<text class="skill-name">{{ getSkillName(skill.skill_code) }}</text>
					<text class="skill-score">{{ skill.score }}分</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted,
		computed
	} from 'vue'
	
	import {
		onShow
	} from '@dcloudio/uni-app'

	import SkillRadar from '@/components/SkillRadar.vue' // 引入组件

	import {
		nextTick,
		watch
	} from 'vue'

	const props = defineProps({
		skills: {
			type: Array,
			default: () => []
		}
	})

	const canvasWidth = 300
	const canvasHeight = 300
	const padding = 40 // 留出写字的空间
	const centerX = canvasWidth / 2
	const centerY = canvasHeight / 2
	const radius = (canvasWidth - padding * 2) / 2
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

	// 绘制雷达图
	const drawRadar = () => {
		const ctx = uni.createCanvasContext('radarCanvas')

		// 1. 画背景网格 (5层)
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

		// 2. 画从中心到顶点的连线
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

		// 3. 准备用户数据并映射分数 (0-100)
		const skillMap = {}
		props.skills.forEach(s => {
			skillMap[s.skill_code] = s.score
		})

		// 绘制用户能力区域
		ctx.beginPath()
		let hasData = false
		for (let i = 0; i < sides; i++) {
			const category = categories[i]
			// 如果没有数据，默认给一个基础分（比如10分），避免缩成一个点
			const score = skillMap[category.code] || 10
			if (skillMap[category.code]) hasData = true

			const currentRadius = radius * (score / 100)
			const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
			const x = centerX + currentRadius * Math.cos(angle)
			const y = centerY + currentRadius * Math.sin(angle)

			if (i === 0) ctx.moveTo(x, y)
			else ctx.lineTo(x, y)
		}
		ctx.closePath()

		// 填充半透明橙黄 + 橙色边框（统一暖色主题）
		ctx.setFillStyle('rgba(255, 154, 60, 0.38)')
		ctx.fill()
		ctx.setStrokeStyle('#FF8A3D')
		ctx.setLineWidth(2)
		ctx.stroke()

		// 4. 绘制节点小圆点
		for (let i = 0; i < sides; i++) {
			const category = categories[i]
			const score = skillMap[category.code] || 10
			if (!skillMap[category.code]) continue // 没数据的点不画圆点

			const currentRadius = radius * (score / 100)
			const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
			const x = centerX + currentRadius * Math.cos(angle)
			const y = centerY + currentRadius * Math.sin(angle)

			ctx.beginPath()
			ctx.arc(x, y, 4, 0, Math.PI * 2)
			ctx.setFillStyle('#FF7A45')
			ctx.fill()
		}

		// 5. 绘制外围文字
		ctx.setFontSize(12)
		ctx.setFillStyle('#666')
		ctx.setTextAlign('center')
		ctx.setTextBaseline('middle')

		for (let i = 0; i < sides; i++) {
			const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
			const textRadius = radius + 20 // 文字稍微靠外一点
			const x = centerX + textRadius * Math.cos(angle)
			const y = centerY + textRadius * Math.sin(angle)
			ctx.fillText(categories[i].name, x, y)
		}

		ctx.draw()
	}

	onMounted(() => {
		nextTick(() => {
			drawRadar()
		})
	})

	// 监听数据变化，重新渲染
	watch(() => props.skills, () => {
		nextTick(() => {
			drawRadar()
		})
	}, {
		deep: true
	})
</script>

<style scoped>
	.radar-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding: 10px 0;
	}

	.radar-canvas {
		background: transparent;
	}
</style>