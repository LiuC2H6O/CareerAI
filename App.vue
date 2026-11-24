<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* ============================================================
	   职航AI · 全局橙黄插画风基础样式
	   ============================================================ */
	page {
		background: #FFF8EE;
		color: #5A4633;
		font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
	}

	/* 统一的插画风卡片：大圆角 + 柔和阴影 + 描边 */
	.fairy-card {
		background: #FFFFFF;
		border-radius: 24rpx;
		box-shadow: 0 10rpx 30rpx rgba(255, 138, 61, 0.10);
		border: 2rpx solid rgba(255, 193, 92, 0.25);
	}

	/* 通用主按钮：橙黄渐变 + 立体感 */
	.fairy-btn-primary {
		background: linear-gradient(135deg, #FF9A3C 0%, #FFB13C 100%);
		color: #FFFFFF;
		border-radius: 999rpx;
		box-shadow: 0 8rpx 18rpx rgba(255, 138, 61, 0.30);
	}

	/* ============================================================
	   插画风页面容器：奶油底 + 柔和光斑（童话感）
	   ============================================================ */
	.fairy-page {
		min-height: 100vh;
		box-sizing: border-box;
		background:
			radial-gradient(circle at 92% 4%, rgba(255, 209, 92, .30), transparent 40%),
			radial-gradient(circle at 4% 26%, rgba(255, 138, 61, .10), transparent 38%),
			linear-gradient(180deg, #FFF4E2 0%, #FFF8EE 240rpx, #FFF8EE 100%);
	}

	/* ============================================================
	   插画风页头 banner：各页通过不同主题类切换配色，避免重复
	   ============================================================ */
	.ip-hero {
		position: relative;
		overflow: hidden;
		border-radius: 0 0 40rpx 40rpx;
		padding: 40rpx 36rpx 44rpx;
		margin: 0 -20rpx 28rpx;
	}

	/* 六种主题渐变，各页交替使用，画面丰富不重复 */
	.ip-hero.t-orange { background: linear-gradient(135deg, #FF9A3C 0%, #FF7A45 100%); }
	.ip-hero.t-amber  { background: linear-gradient(135deg, #FFB13C 0%, #FF8A3D 100%); }
	.ip-hero.t-coral  { background: linear-gradient(135deg, #FF8A65 0%, #FF7043 100%); }
	.ip-hero.t-gold   { background: linear-gradient(135deg, #FFC94A 0%, #FF9A3C 100%); }
	.ip-hero.t-peach  { background: linear-gradient(135deg, #FFAB76 0%, #FF8A5B 100%); }
	.ip-hero.t-sunset { background: linear-gradient(135deg, #FF9A3C 0%, #F5662E 100%); }

	/* 自定义导航页：banner 贴顶，内容避开手机状态栏 */
	.ip-hero.custom-nav-hero {
		padding-top: calc(var(--status-bar-height, 20px) + 24rpx);
	}

	.ip-hero-row {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
	}

	.ip-hero-icon {
		width: 92rpx;
		height: 92rpx;
		margin-right: 20rpx;
		border-radius: 26rpx;
		background: rgba(255, 255, 255, .92);
		padding: 14rpx;
		box-sizing: border-box;
		box-shadow: 0 8rpx 20rpx rgba(180, 80, 20, .18);
	}

	.ip-hero-emoji {
		font-size: 52rpx;
		margin-right: 18rpx;
		line-height: 1;
	}

	.ip-hero-title {
		display: block;
		font-size: 36rpx;
		font-weight: 800;
		color: #FFFFFF;
		letter-spacing: 1rpx;
		text-shadow: 0 2rpx 6rpx rgba(180, 80, 20, .25);
	}

	.ip-hero-sub {
		display: block;
		font-size: 23rpx;
		color: rgba(255, 255, 255, .9);
		margin-top: 8rpx;
	}

	/* 页头漂浮装饰：光环 + 星星 */
	.ip-ring {
		position: absolute;
		border: 3rpx solid rgba(255, 255, 255, .22);
		border-radius: 50%;
	}
	.ip-ring.r1 { width: 220rpx; height: 220rpx; right: -60rpx; top: -70rpx; }
	.ip-ring.r2 { width: 130rpx; height: 130rpx; right: 60rpx; bottom: -60rpx; }
	.ip-star {
		position: absolute;
		color: rgba(255, 255, 255, .85);
		z-index: 1;
	}
	.ip-star.s1 { right: 18%; top: 22rpx; font-size: 30rpx; }
	.ip-star.s2 { right: 34%; bottom: 26rpx; font-size: 22rpx; }
	.ip-star.s3 { right: 8%; bottom: 60rpx; font-size: 26rpx; }

	/* 章节小标题（插画风） */
	.ip-section {
		display: flex;
		align-items: center;
		margin: 12rpx 0 22rpx;
	}
	.ip-section-emoji { font-size: 34rpx; margin-right: 12rpx; }
	.ip-section-title { font-size: 30rpx; font-weight: 800; color: #7A3E12; }
	.ip-section-sub { font-size: 21rpx; color: #B08A63; margin-left: auto; }

	/* 空状态插画卡 */
	.ip-empty {
		text-align: center;
		padding: 56rpx 32rpx;
		color: #A08C77;
		font-size: 26rpx;
	}
	.ip-empty-emoji { font-size: 76rpx; display: block; margin-bottom: 18rpx; }
</style>
