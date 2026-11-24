<template>
	<view class="container fairy-page">
		<view class="ip-hero t-orange">
			<view class="ip-ring r1"></view>
			<view class="ip-ring r2"></view>
			<text class="ip-star s1">✦</text>
			<text class="ip-star s3">✧</text>
			<view class="ip-hero-row">
				<image class="ip-hero-icon" src="/static/icons/jobs.png" mode="aspectFit"></image>
				<view>
					<text class="ip-hero-title">岗位列表</text>
					<text class="ip-hero-sub">发现适合你的机会</text>
				</view>
			</view>
		</view>

		<view v-for="job in jobs" :key="job._id" class="job-card">
			<view class="job-header">
				<text class="job-name">{{ job.job_name }}</text>
				<text class="job-cat">{{ job.job_category }}</text>
			</view>
			<view class="job-desc">{{ job.description }}</view>
			<button class="btn" @click="goToMatch(job._id)">查看匹配度</button>
		</view>

		<view v-if="jobs.length === 0" class="empty">暂无岗位数据，请先在云数据库添加</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue'

	const jobs = ref([])
	const careerService = uniCloud.importObject('career-service')

	onMounted(async () => {
		uni.showLoading({
			title: '加载中...'
		})
		try {
			const res = await careerService.getJobs()
			if (res.code === 0) {
				jobs.value = res.data
			}
		} catch (e) {
			console.error(e)
		}
		uni.hideLoading()
	})

	const goToMatch = (jobId) => {
		// 跳转到匹配详情页（注意这里用的是 navigateTo 且带参数）
		uni.navigateTo({
			url: `/pages/career/match?jobId=${jobId}`
		})
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
		margin-bottom: 20px;
	}

	.job-card {
		background: #fff;
		padding: 20px;
		border-radius: 10px;
		margin-bottom: 15px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.job-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.job-name {
		font-size: 18px;
		font-weight: bold;
		color: #333;
	}

	.job-cat {
		font-size: 12px;
		color: #FF8A3D;
		background: #FFF4E0;
		padding: 2px 8px;
		border-radius: 12px;
	}

	.job-desc {
		font-size: 14px;
		color: #666;
		margin-bottom: 15px;
		line-height: 1.4;
	}

	.btn {
		background-color: #FF8A3D;
		color: white;
		border-radius: 8px;
		font-size: 14px;
		padding: 8px 0;
	}

	.empty {
		text-align: center;
		color: #999;
		margin-top: 50px;
		font-size: 14px;
	}
</style>