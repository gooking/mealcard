<template>
	<view class="statistics-page">
		<!-- 今日统计 -->
		<view class="stats-section">
			<view class="section-title">今日数据</view>
			<view class="stats-grid">
				<view class="stat-card">
					<text class="stat-value">{{ todayStats.count }}</text>
					<text class="stat-label">核销笔数</text>
				</view>
				<view class="stat-card">
					<text class="stat-value">¥{{ todayStats.amount }}</text>
					<text class="stat-label">消费金额</text>
				</view>
			</view>
		</view>

		<!-- 累计统计 -->
		<view class="stats-section">
			<view class="section-title">累计数据</view>
			<view class="stats-grid">
				<view class="stat-card">
					<text class="stat-value">{{ totalStats.consumeCount }}</text>
					<text class="stat-label">累计核销</text>
				</view>
				<view class="stat-card">
					<text class="stat-value">¥{{ totalStats.consumeAmount }}</text>
					<text class="stat-label">累计消费</text>
				</view>
				<view class="stat-card">
					<text class="stat-value">{{ totalStats.rechargeCount }}</text>
					<text class="stat-label">充值笔数</text>
				</view>
				<view class="stat-card">
					<text class="stat-value">¥{{ totalStats.rechargeAmount }}</text>
					<text class="stat-label">充值金额</text>
				</view>
			</view>
		</view>

		<!-- 会员消费排行 -->
		<view class="rank-section">
			<view class="section-title">会员消费排行 TOP10</view>
			<view class="rank-list">
				<view class="rank-item" v-for="(item, index) in rankList" :key="index">
					<view class="rank-left">
						<view class="rank-badge" :class="getRankClass(index)">
							<text class="rank-number">{{ index + 1 }}</text>
						</view>
						<view class="rank-info">
							<text class="rank-mobile">{{ item.mobile }}</text>
							<text class="rank-level">{{ item.levelName }}</text>
						</view>
					</view>
					<view class="rank-right">
						<text class="rank-amount">¥{{ item.amount }}</text>
						<text class="rank-count">{{ item.count }}笔</text>
					</view>
				</view>

				<view class="empty-tip" v-if="rankList.length === 0">
					<uni-icons type="info" size="60" color="#ccc"></uni-icons>
					<text class="empty-text">暂无排行数据</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				todayStats: {
					count: 0,
					amount: 0
				},
				totalStats: {
					consumeCount: 0,
					consumeAmount: 0,
					rechargeCount: 0,
					rechargeAmount: 0
				},
				rankList: []
			}
		},

		onShow() {
			this.checkLogin()
			this.loadStatistics()
		},

		methods: {
			checkLogin() {
				const merchantToken = this.$store.state.merchantToken
				if (!merchantToken) {
					uni.redirectTo({
						url: '/pages/merchant/login'
					})
				}
			},

			async loadStatistics() {
				await this.loadTodayStats()
				await this.loadTotalStats()
				await this.loadRankList()
			},

			async loadTodayStats() {
				const merchantToken = this.$store.state.merchantToken
				const res = await this.$wxapi.merchantTodayStats({
					token: merchantToken
				})

				if (res.code === 0) {
					this.todayStats = {
						count: res.data.count || 0,
						amount: res.data.amount || 0
					}
				}
			},

			async loadTotalStats() {
				const merchantToken = this.$store.state.merchantToken
				const res = await this.$wxapi.merchantTotalStats({
					token: merchantToken
				})

				if (res.code === 0) {
					this.totalStats = {
						consumeCount: res.data.consumeCount || 0,
						consumeAmount: res.data.consumeAmount || 0,
						rechargeCount: res.data.rechargeCount || 0,
						rechargeAmount: res.data.rechargeAmount || 0
					}
				}
			},

			async loadRankList() {
				const merchantToken = this.$store.state.merchantToken
				const res = await this.$wxapi.merchantRankList({
					token: merchantToken,
					limit: 10
				})

				if (res.code === 0 && res.data) {
					this.rankList = res.data.map(item => ({
						mobile: this.maskMobile(item.mobile),
						levelName: item.levelName || '普通会员',
						amount: item.amount || 0,
						count: item.count || 0
					}))
				}
			},

			maskMobile(mobile) {
				if (!mobile) return ''
				return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
			},

			getRankClass(index) {
				if (index === 0) return 'rank-first'
				if (index === 1) return 'rank-second'
				if (index === 2) return 'rank-third'
				return ''
			}
		}
	}
</script>

<style lang="scss" scoped>
	.statistics-page {
		min-height: 100vh;
		background: #f5f5f5;
		padding-bottom: 30rpx;
	}

	.stats-section {
		margin: 30rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 20rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
	}

	.stat-card {
		padding: 40rpx 20rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 15rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15rpx;
	}

	.stat-value {
		font-size: 40rpx;
		font-weight: bold;
		color: #fff;
	}

	.stat-label {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.rank-section {
		margin: 30rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 20rpx;
	}

	.rank-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.rank-item {
		padding: 25rpx;
		background: #f8f8f8;
		border-radius: 15rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.rank-left {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.rank-badge {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background: #ccc;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.rank-first {
		background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
	}

	.rank-second {
		background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
	}

	.rank-third {
		background: linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%);
	}

	.rank-number {
		font-size: 28rpx;
		font-weight: bold;
		color: #fff;
	}

	.rank-info {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.rank-mobile {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}

	.rank-level {
		font-size: 22rpx;
		color: #999;
	}

	.rank-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8rpx;
	}

	.rank-amount {
		font-size: 32rpx;
		font-weight: bold;
		color: #f5576c;
	}

	.rank-count {
		font-size: 22rpx;
		color: #999;
	}

	.empty-tip {
		padding: 100rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
</style>
