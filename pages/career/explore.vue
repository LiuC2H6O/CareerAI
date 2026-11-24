<template>
	<view class="page-container fairy-page">
		<!-- 插画页头 -->
		<view class="ip-hero t-amber custom-nav-hero">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s3">✧</text>
			<view class="ip-hero-row">
				<image class="ip-hero-icon" src="/static/icons/career.png" mode="aspectFit"></image>
				<view>
					<text class="ip-hero-title">职业探索</text>
					<text class="ip-hero-sub">明确目标，看清差距</text>
				</view>
			</view>
		</view>

		<!-- 1. 档案卡片（展示/编辑模式） -->
		<view class="card profile-card">
			<view class="card-header">
				<text class="card-title">我的职业档案</text>
				<text class="edit-btn" @click="toggleEdit">{{ isEditing ? '取消' : '编辑' }}</text>
			</view>
			
			<!-- 编辑模式 -->
			<view v-if="isEditing" class="edit-mode">
				<view class="form-item">
					<text class="label">专业</text>
					<input v-model="formData.major" placeholder="如：计算机科学与技术" class="input" />
				</view>
				<view class="form-item">
					<text class="label">年级</text>
					<input v-model="formData.grade" placeholder="如：大三" class="input" />
				</view>
				<view class="form-item">
					<text class="label">学校</text>
					<input v-model="formData.school" placeholder="如：某某大学" class="input" />
				</view>
				<button class="btn-primary" @click="save">保存档案</button>
			</view>

			<!-- 展示模式 -->
			<view v-else class="view-mode">
				<view v-if="profile" class="info-grid">
					<view class="info-item">
						<text class="info-label">专业</text>
						<text class="info-val">{{ profile.major }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">年级</text>
						<text class="info-val">{{ profile.grade }}</text>
					</view>
					<view class="info-item full-width">
						<text class="info-label">学校</text>
						<text class="info-val">{{ profile.school || '未填写' }}</text>
					</view>
				</view>
				<view v-else class="empty-tips">
					<text>你还没有填写职业档案，完善后可获取精准匹配</text>
					<button class="btn-outline" @click="isEditing = true">立即完善</button>
				</view>
			</view>
		</view>

		<!-- 2. 核心能力摘要 -->
		<view class="card">
			<view class="card-header">
				<text class="card-title">能力摘要</text>
				<text class="more-link" @click="goToAssessment">去测评 ></text>
			</view>
			
			<view v-if="topSkills.length > 0" class="skill-list">
				<view v-for="skill in topSkills" :key="skill._id" class="skill-item">
					<view class="skill-head">
						<text class="skill-name">{{ skill.name || getSkillName(skill.skill_code) }}</text>
						<text class="skill-score">{{ skill.score }}分</text>
					</view>
					<view class="bar-bg">
						<view class="bar-fill" :style="{ width: skill.score + '%' }"></view>
					</view>
				</view>
			</view>
			<view v-else class="empty-tips">
				<text>暂无能力数据，建议先完成能力测评</text>
			</view>
		</view>

		<!-- 3. 推荐岗位 -->
		<view class="section-title">
			<text>热门岗位推荐</text>
			<text class="view-all" @click="goToJobs">查看全部 ></text>
		</view>
		
		<view class="job-list">
			<view v-for="job in recommendedJobs" :key="job._id" class="job-card" @click="goToMatch(job._id)">
				<view class="job-top">
					<text class="job-name">{{ job.job_name }}</text>
					<text class="job-cat">{{ job.job_category }}</text>
				</view>
				<view class="job-desc">{{ job.description }}</view>
				<view class="job-action">
					<text>查看匹配度</text>
					<text class="arrow">></text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const careerService = uniCloud.importObject('career-service')

// 数据状态
const profile = ref(null)
const topSkills = ref([])
const recommendedJobs = ref([])

// 编辑状态
const isEditing = ref(false)
const formData = ref({ major: '', grade: '', school: '' })

// 获取数据
const loadData = async () => {
	uni.showLoading({ title: '加载中...' })
	try {
		const res = await careerService.getExploreData(uni.getStorageSync('token') || '')
		if (res.code === 0) {
			profile.value = res.data.profile
			topSkills.value = res.data.topSkills
			recommendedJobs.value = res.data.recommendedJobs
			
			// 如果有档案，同步到表单里
			if (profile.value) {
				formData.value = {
					major: profile.value.major,
					grade: profile.value.grade,
					school: profile.value.school
				}
			}
		}
	} catch (e) {
		console.error(e)
		uni.showToast({ title: '数据加载失败', icon: 'none' })
	}
	uni.hideLoading()
}

// 切换编辑模式
const toggleEdit = () => {
	isEditing.value = !isEditing.value
	if (!isEditing.value && profile.value) {
		// 取消编辑时，恢复原数据
		formData.value = { major: profile.value.major, grade: profile.value.grade, school: profile.value.school }
	}
}

// 保存档案
const save = async () => {
	if (!formData.value.major || !formData.value.grade) {
		return uni.showToast({ title: '专业和年级不能为空', icon: 'none' })
	}
	
	uni.showLoading({ title: '保存中...' })
	try {
		const res = await careerService.saveProfile(formData.value, uni.getStorageSync('token') || '')
		if (res.code === 0) {
			uni.showToast({ title: '保存成功', icon: 'success' })
			isEditing.value = false
			loadData() // 重新加载页面数据
		} else {
			uni.showToast({ title: res.message, icon: 'none' })
		}
	} catch (e) {
		uni.showToast({ title: '保存失败', icon: 'none' })
	}
	uni.hideLoading()
}

// 能力代码映射
const getSkillName = (code) => {
	const map = { 'logic': '逻辑思维', 'professional': '专业基础', 'communication': '沟通表达', 'digital': '数字技能', 'practice': '实践能力', 'career': '求职能力' }
	return map[code] || code
}

// 路由跳转
const goToJobs = () => { uni.navigateTo({ url: '/pages/career/jobs' }) }
const goToMatch = (jobId) => { uni.navigateTo({ url: `/pages/career/match?jobId=${jobId}` }) }
const goToAssessment = () => { uni.switchTab({ url: '/pages/assessment/index' }) }

onMounted(() => {
	loadData()
})
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	padding: 0 20px 40px;
}

/* 通用卡片样式 */
.card {
	background: #fff;
	border-radius: 18px;
	padding: 20px;
	margin-bottom: 20px;
	box-shadow: 0 8px 22px rgba(255, 138, 61, .10);
	border: 1px solid rgba(255, 193, 92, .22);
	
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
		border-bottom: 1px solid #FFF6E8;
		padding-bottom: 10px;
		
		.card-title { font-size: 16px; font-weight: bold; color: #333; }
		.edit-btn { font-size: 14px; color: #FF8A3D; }
		.more-link { font-size: 13px; color: #999; }
	}
}

/* 档案展示区 */
.info-grid {
	display: flex;
	flex-wrap: wrap;
	.info-item {
		width: 50%;
		margin-bottom: 15px;
		display: flex;
		flex-direction: column;
		
		&.full-width { width: 100%; margin-bottom: 0; }
		
		.info-label { font-size: 12px; color: #999; margin-bottom: 4px; }
		.info-val { font-size: 15px; color: #333; font-weight: 500; }
	}
}

/* 档案编辑区 */
.edit-mode {
	.form-item {
		margin-bottom: 15px;
		.label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
		.input { border: 1px solid #eee; background: #FFFBF5; padding: 10px; border-radius: 8px; font-size: 14px; }
	}
	.btn-primary { background: #FF8A3D; color: #fff; border-radius: 8px; font-size: 15px; margin-top: 10px; }
}

.empty-tips {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 10px 0;
	text { font-size: 13px; color: #999; margin-bottom: 15px; }
	.btn-outline { background: #fff; color: #FF8A3D; border: 1px solid #FF8A3D; border-radius: 20px; font-size: 13px; padding: 6px 20px; }
}

/* 能力进度条 */
.skill-list {
	.skill-item {
		margin-bottom: 15px;
		&:last-child { margin-bottom: 0; }
		
		.skill-head {
			display: flex;
			justify-content: space-between;
			margin-bottom: 6px;
			.skill-name { font-size: 14px; color: #333; }
			.skill-score { font-size: 14px; font-weight: bold; color: #FF8A3D; }
		}
		.bar-bg {
			height: 8px;
			background: #FFF6E8;
			border-radius: 4px;
			overflow: hidden;
			.bar-fill { height: 100%; background: linear-gradient(90deg, #FFB547, #EF7A2A); border-radius: 4px; }
		}
	}
}

/* 推荐岗位区 */
.section-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15px;
	padding: 0 5px;
	text { font-size: 16px; font-weight: bold; color: #333; }
	.view-all { font-size: 13px; color: #999; font-weight: normal; }
}

.job-list {
	.job-card {
		background: #fff;
		border-radius: 12px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		transition: transform 0.1s;
		
		&:active { transform: scale(0.98); }
		
		.job-top {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 8px;
			.job-name { font-size: 16px; font-weight: bold; color: #333; }
			.job-cat { font-size: 12px; color: #FF8A3D; background: #FFF4E0; padding: 2px 8px; border-radius: 10px; }
		}
		.job-desc { font-size: 13px; color: #666; line-height: 1.4; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
		.job-action {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 13px;
			color: #FF8A3D;
			border-top: 1px solid #FFF6E8;
			padding-top: 10px;
			.arrow { font-weight: bold; }
		}
	}
}
</style>