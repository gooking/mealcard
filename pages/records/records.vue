<template>
	<view class="records-page">
		<!-- 统计卡片 -->
		<!-- <view class="stats-card">
			<view class="stat-item">
				<text class="stat-value">¥{{ totalRecharge }}</text>
				<text class="stat-label">累计充值</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value">¥{{ totalConsume }}</text>
				<text class="stat-label">累计消费</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value">¥{{ balance }}</text>
				<text class="stat-label">剩余余额</text>
			</view>
		</view> -->

		<!-- 时间筛选 -->
		<view class="filter-section">
			<view 
				class="filter-item" 
				:class="{ active: timeFilter === item.value }"
				v-for="(item, index) in timeFilters" 
				:key="index"
				@click="changeTimeFilter(item.value)"
			>
				<text class="filter-text">{{ item.label }}</text>
			</view>
		</view>

		<!-- 记录类型切换 -->
		<!-- <view class="type-tabs">
			<view 
				class="tab-item" 
				:class="{ active: recordType === 'consume' }"
				@click="changeRecordType('consume')"
			>
				<text class="tab-text">消费记录</text>
			</view>
			<view 
				class="tab-item" 
				:class="{ active: recordType === 'recharge' }"
				@click="changeRecordType('recharge')"
			>
				<text class="tab-text">充值记录</text>
			</view>
		</view> -->

		<!-- 记录列表 -->
		<view class="records-list">
			<view class="record-item" v-for="(item, index) in list" :key="item.id || index">
				<view class="record-left">
					<view class="record-icon" :class="(item.type == 0 && item.amount > 0) ? 'recharge-icon' : 'consume-icon'">
						<uni-icons type="wallet" size="24" color="#fff"></uni-icons>
					</view>
					<view class="record-info">
						<text v-if="item.type == 0 && item.amount < 0" class="record-title">消费</text>
						<text v-else class="record-title">{{ item.typeStr }}</text>
						<text class="record-time">{{ item.createTime }}</text>
						<text class="record-detail" v-if="item.remark">{{ item.remark }}</text>
					</view>
				</view>
				<view class="record-right">
					<text class="record-amount" :class="(item.type == 0 && item.amount > 0) ? 'recharge-amount' : 'consume-amount'">{{ item.amount.toFixed(2) }}</text>
					<text class="record-status">余额: ¥{{ item.balance.toFixed(2) }}</text>
				</view>
			</view>
			
			<view class="empty-tip" v-if="list.length === 0">
				<uni-icons type="info" size="60" color="#ccc"></uni-icons>
				<text class="empty-text">暂无充值记录</text>
			</view>
		</view>

		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore">
			<text class="load-text" @click="loadMore">加载更多</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				balance: 0,
				totalRecharge: 0,
				totalConsume: 0,
				timeFilter: 'all',
				recordType: 'consume',
				list: [],
				page: 1,
				pageSize: 20,
				hasMore: true,
				timeFilters: [
					{ label: '全部', value: 'all' },
					{ label: '今日', value: 'today' },
					{ label: '本周', value: 'week' },
					{ label: '本月', value: 'month' }
				]
			}
		},

		onShow() {
			if (this.token) {
				this.loadData()
			}
		},

		methods: {
			async loadData() {
				await this.loadRecords()
			},

			async loadRecords() {
				uni.showLoading({ title: '加载中...' })
				
				const { dateAddBegin, dateAddEnd } = this.getTimeRange()
				
				const res = await this.$wxapi.cashLogsV3({
					token: this.token,
					page: this.page,
					pageSize: this.pageSize,
					dateAddBegin,
					dateAddEnd
				})

				uni.hideLoading()

				if (res.code === 0 && res.data && res.data.result) {
					const records = res.data.result.map(item => ({
						id: item.id,
						amount: item.amount,
						balance: item.balance,
						behavior: item.behavior,
						createTime: item.dateAdd,
						remark: item.remark,
						type: item.type,
						typeStr: item.typeStr
					}))

					if (this.page === 1) {
						this.list = records
					} else {
						this.list = [...this.list, ...records]
					}

					this.hasMore = records.length >= this.totalRow
				} else {
					if (this.page === 1) {
						this.list = []
					}
					this.hasMore = false
				}
			},

			getTimeRange() {
				const now = new Date()
				let dateAddBegin = ''
				let dateAddEnd = ''

				switch (this.timeFilter) {
					case 'today':
						dateAddBegin = this.formatDate(now)
						dateAddEnd = this.formatDate(now)
						break
					case 'week':
						const weekStart = new Date(now)
						weekStart.setDate(now.getDate() - now.getDay())
						dateAddBegin = this.formatDate(weekStart)
						dateAddEnd = this.formatDate(now)
						break
					case 'month':
						const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
						dateAddBegin = this.formatDate(monthStart)
						dateAddEnd = this.formatDate(now)
						break
					case 'all':
					default:
						dateAddBegin = ''
						dateAddEnd = ''
						break
				}

				return { dateAddBegin, dateAddEnd }
			},

			formatDate(date) {
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			},

			changeTimeFilter(value) {
				this.timeFilter = value
				this.page = 1
				this.hasMore = true
				this.loadRecords()
			},

			changeRecordType(type) {
				this.recordType = type
				this.page = 1
				this.hasMore = true
				this.loadRecords()
			},

			loadMore() {
				this.page++
				this.loadRecords()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.records-page {
		min-height: 100vh;
		background: #f5f5f5;
		padding-bottom: 30rpx;
	}

	.stats-card {
		margin: 30rpx;
		padding: 40rpx;
		background: #fff;
		border-radius: 20rpx;
		display: flex;
		justify-content: space-around;
		align-items: center;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15rpx;
	}

	.stat-value {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.stat-label {
		font-size: 24rpx;
		color: #999;
	}

	.stat-divider {
		width: 2rpx;
		height: 60rpx;
		background: #f0f0f0;
	}

	.filter-section {
		margin: 0 30rpx 30rpx;
		padding: 10rpx;
		background: #fff;
		border-radius: 15rpx;
		display: flex;
		gap: 10rpx;
	}

	.filter-item {
		flex: 1;
		padding: 15rpx 0;
		text-align: center;
		border-radius: 10rpx;
	}

	.filter-item.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.filter-text {
		font-size: 26rpx;
		color: #666;
	}

	.filter-item.active .filter-text {
		color: #fff;
		font-weight: 500;
	}

	.type-tabs {
		margin: 0 30rpx 30rpx;
		display: flex;
		background: #fff;
		border-radius: 15rpx;
		overflow: hidden;
	}

	.tab-item {
		flex: 1;
		padding: 25rpx 0;
		text-align: center;
	}

	.tab-item.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.tab-text {
		font-size: 28rpx;
		color: #666;
	}

	.tab-item.active .tab-text {
		color: #fff;
		font-weight: bold;
	}

	.records-list {
		margin: 0 30rpx;
	}

	.record-item {
		margin-bottom: 20rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 15rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.record-left {
		display: flex;
		align-items: center;
		gap: 20rpx;
		flex: 1;
	}

	.record-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.consume-icon {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.recharge-icon {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.record-info {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		flex: 1;
	}

	.record-title {
		font-size: 30rpx;
		font-weight: 500;
		color: #333;
	}

	.record-time {
		font-size: 24rpx;
		color: #999;
	}

	.record-detail {
		font-size: 22rpx;
		color: #f5576c;
	}

	.record-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8rpx;
	}

	.record-amount {
		font-size: 32rpx;
		font-weight: bold;
	}

	.consume-amount {
		color: #f5576c;
	}

	.recharge-amount {
		color: #43e97b;
	}

	.record-status {
		font-size: 22rpx;
		color: #999;
	}

	.status-pending {
		color: #ff9500;
	}

	.status-success {
		color: #43e97b;
	}

	.status-cancel {
		color: #999;
	}

	.status-refund {
		color: #f5576c;
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

	.load-more {
		padding: 40rpx 0;
		text-align: center;
	}

	.load-text {
		font-size: 26rpx;
		color: #667eea;
	}
</style>
