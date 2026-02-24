<template>
	<view class="orders-page">
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

		<!-- 订单列表 -->
		<view class="orders-list">
			<view class="order-item" v-for="(item, index) in orders" :key="index">
				<view class="order-header">
					<text class="order-time">{{ formatTime(item.createTime) }}</text>
					<text class="order-status">{{ item.statusText }}</text>
				</view>
				<view class="order-content">
					<view class="order-info">
						<view class="info-row">
							<text class="info-label">用户手机</text>
							<text class="info-value">{{ item.userMobile }}</text>
						</view>
						<view class="info-row">
							<text class="info-label">消费金额</text>
							<text class="info-value amount-value">¥{{ item.amount }}</text>
						</view>
						<view class="info-row" v-if="item.discount < 1">
							<text class="info-label">会员折扣</text>
							<text class="info-value discount-value">{{ item.discount * 10 }}折</text>
						</view>
						<view class="info-row">
							<text class="info-label">订单号</text>
							<text class="info-value order-no">{{ item.orderNo }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="empty-tip" v-if="orders.length === 0">
				<uni-icons type="info" size="60" color="#ccc"></uni-icons>
				<text class="empty-text">暂无订单记录</text>
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
				timeFilter: 'today',
				orders: [],
				page: 1,
				pageSize: 20,
				hasMore: true,
				timeFilters: [
					{ label: '今日', value: 'today' },
					{ label: '本周', value: 'week' },
					{ label: '本月', value: 'month' },
					{ label: '全部', value: 'all' }
				]
			}
		},

		onShow() {
			this.checkLogin()
			this.loadOrders()
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

			async loadOrders() {
				const merchantToken = this.$store.state.merchantToken
				
				const res = await this.$wxapi.merchantOrders({
					token: merchantToken,
					page: this.page,
					pageSize: this.pageSize,
					timeFilter: this.timeFilter
				})

				if (res.code === 0 && res.data) {
					const orders = res.data.map(item => ({
						orderNo: item.orderNo,
						userMobile: this.maskMobile(item.userMobile),
						amount: item.amount,
						discount: item.discount || 1,
						createTime: item.createTime,
						status: item.status,
						statusText: this.getStatusText(item.status)
					}))

					if (this.page === 1) {
						this.orders = orders
					} else {
						this.orders = [...this.orders, ...orders]
					}

					this.hasMore = orders.length >= this.pageSize
				}
			},

			changeTimeFilter(value) {
				this.timeFilter = value
				this.page = 1
				this.loadOrders()
			},

			loadMore() {
				this.page++
				this.loadOrders()
			},

			maskMobile(mobile) {
				if (!mobile) return ''
				return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
			},

			formatTime(timestamp) {
				const date = new Date(timestamp)
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				const hour = String(date.getHours()).padStart(2, '0')
				const minute = String(date.getMinutes()).padStart(2, '0')
				const second = String(date.getSeconds()).padStart(2, '0')
				
				return `${year}-${month}-${day} ${hour}:${minute}:${second}`
			},

			getStatusText(status) {
				const statusMap = {
					0: '待确认',
					1: '已完成',
					2: '已取消'
				}
				return statusMap[status] || '未知'
			}
		}
	}
</script>

<style lang="scss" scoped>
	.orders-page {
		min-height: 100vh;
		background: #f5f5f5;
		padding-bottom: 30rpx;
	}

	.filter-section {
		margin: 30rpx;
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

	.orders-list {
		margin: 0 30rpx;
	}

	.order-item {
		margin-bottom: 20rpx;
		background: #fff;
		border-radius: 15rpx;
		overflow: hidden;
	}

	.order-header {
		padding: 20rpx 30rpx;
		background: #f8f8f8;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.order-time {
		font-size: 24rpx;
		color: #666;
	}

	.order-status {
		font-size: 24rpx;
		color: #43e97b;
		font-weight: 500;
	}

	.order-content {
		padding: 30rpx;
	}

	.order-info {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-label {
		font-size: 26rpx;
		color: #999;
	}

	.info-value {
		font-size: 28rpx;
		color: #333;
	}

	.amount-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #f5576c;
	}

	.discount-value {
		color: #667eea;
		font-weight: 500;
	}

	.order-no {
		font-size: 24rpx;
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

	.load-more {
		padding: 40rpx 0;
		text-align: center;
	}

	.load-text {
		font-size: 26rpx;
		color: #667eea;
	}
</style>
