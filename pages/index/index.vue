<template>
	<view class="index">
		<!-- 轮播图 -->
		<swiper class="banner-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500" circular>
			<swiper-item v-for="(item, index) in banners" :key="index">
				<image :src="item" mode="aspectFill" class="banner-image"></image>
			</swiper-item>
		</swiper>

		<!-- 核心数据卡片 -->
		<view class="info-card">
			<view class="balance-section">
				<view class="balance-label">账户余额</view>
				<view class="balance-amount">¥{{ balance }}</view>
			</view>
			<view class="info-row">
				<view class="info-item">
					<text class="info-label">会员等级</text>
					<text class="info-value">{{ memberLevel || '普通会员' }}</text>
				</view>
				<view v-if="memberLevel" class="info-item">
					<text class="info-label">有效期至</text>
					<text class="info-value">{{ expireDate || '永久有效' }}</text>
				</view>
			</view>
		</view>

		<!-- 快捷入口 -->
		<view class="quick-actions">
			<view class="action-item" @click="goRecharge">
				<view class="action-icon recharge-icon">
					<uni-icons type="wallet" size="32" color="#fff"></uni-icons>
				</view>
				<text class="action-text">充值</text>
			</view>
			<view class="action-item" @click="goConsume">
				<view class="action-icon consume-icon">
					<uni-icons type="scan" size="32" color="#fff"></uni-icons>
				</view>
				<text class="action-text">消费</text>
			</view>
			<view class="action-item" @click="goRecords">
				<view class="action-icon records-icon">
					<uni-icons type="list" size="32" color="#fff"></uni-icons>
				</view>
				<text class="action-text">记录</text>
			</view>
			<view class="action-item" @click="contactService">
				<view class="action-icon service-icon">
					<uni-icons type="phone" size="32" color="#fff"></uni-icons>
				</view>
				<text class="action-text">客服</text>
			</view>
		</view>

		<!-- 活动推荐 -->
		<view class="activity-section">
			<view class="section-title">充值优惠</view>
			<view class="activity-list" v-if="rechargeRules.length > 0">
				<view class="activity-item" v-for="(item, index) in rechargeRules" :key="index">
					<view class="activity-content">
						<text class="activity-title">充{{ item.confine }}送{{ item.send }}</text>
						<text class="activity-desc">实得{{ item.confine + item.send }}元</text>
						<text class="activity-tag" v-if="item.loop">多充多送</text>
					</view>
				</view>
			</view>
			<view v-else class="empty-tip">暂无充值优惠活动</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				banners: [],
				balance: 0,
				memberLevel: undefined,
				expireDate: undefined,
				rechargeRules: []
			}
		},

		async onLoad() {
			this.loadBanners()
			this.loadRechargeRules()
			this.checkLogin()
		},
		
		onShow() {
			if (this.token) {
				this.loadUserInfo()
			}
		},

		methods: {
			async loadBanners() {
				try {
					const res = await this.$wxapi.banners({
						type: 'index'
					})
					if (res.code === 0 && res.data && res.data.length > 0) {
						this.banners = res.data.map(item => item.picUrl)
					}
				} catch (error) {
					console.error('加载轮播图失败:', error)
				}
			},
			
			async loadRechargeRules() {
				try {
					const res = await this.$wxapi.rechargeSendRules()
					if (res.code === 0 && res.data) {
						this.rechargeRules = res.data
					}
				} catch (error) {
					console.error('加载充值规则失败:', error)
				}
			},
			checkLogin() {
				if (!this.token) {
					uni.showModal({
						content: '请先登录',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/login/login'
								})
							}
						}
					})
				}
			},

			async loadUserInfo() {
				// 获取用户余额和会员信息
				const res = await this.$wxapi.userAmount(this.token)
				if (res.code === 0) {
					this.balance = res.data.balance || 0
				}
				
				// 获取会员信息
				const memberRes = await this.$wxapi.userDetail(this.token)
				if (memberRes.code == 0) {
					this.expireDate = this.formatDate(memberRes.data.base.levelExpire)
					if(memberRes.data.userLevel) {
						this.memberLevel = memberRes.data.userLevel.name
					}
				}
			},

			formatDate(timestamp) {
				const date = new Date(timestamp)
				return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
			},

			goRecharge() {
				if (!this.token) {
					this.checkLogin()
					return
				}
				uni.navigateTo({
					url: '/pages/recharge/recharge'
				})
			},

			goConsume() {
				if (!this.token) {
					this.checkLogin()
					return
				}
				uni.navigateTo({
					url: '/pages/consume/consume'
				})
			},

			goRecords() {
				uni.switchTab({
					url: '/pages/records/records'
				})
			},

			contactService() {
				const phone = this.sysconfigMap.kf_tel || '400-000-0000'
				uni.showModal({
					title: '联系客服',
					content: `客服电话：${phone}`,
					confirmText: '拨打',
					success: (res) => {
						if (res.confirm) {
							uni.makePhoneCall({
								phoneNumber: phone
							})
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.index {
		min-height: 100vh;
		background: #f5f5f5;
	}

	.banner-swiper {
		width: 100%;
		height: 400rpx;
	}

	.banner-image {
		width: 100%;
		height: 100%;
	}

	.info-card {
		margin: 30rpx;
		padding: 40rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.3);
	}

	.balance-section {
		margin-bottom: 30rpx;
	}

	.balance-label {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 10rpx;
	}

	.balance-amount {
		font-size: 60rpx;
		font-weight: bold;
		color: #fff;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding-top: 30rpx;
		border-top: 1rpx solid rgba(255, 255, 255, 0.2);
	}

	.info-item {
		display: flex;
		flex-direction: column;
	}

	.info-label {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 10rpx;
	}

	.info-value {
		font-size: 28rpx;
		color: #fff;
		font-weight: 500;
	}

	.quick-actions {
		display: flex;
		justify-content: space-around;
		padding: 40rpx 30rpx;
		background: #fff;
		margin: 30rpx;
		border-radius: 20rpx;
	}

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.action-icon {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 15rpx;
	}

	.recharge-icon {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.consume-icon {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.records-icon {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}

	.service-icon {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
	}

	.action-text {
		font-size: 26rpx;
		color: #333;
	}

	.activity-section {
		margin: 30rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 20rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.activity-item {
		padding: 30rpx;
		background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
		border-radius: 15rpx;
	}

	.activity-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.activity-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.activity-desc {
		font-size: 26rpx;
		color: #666;
	}

	.activity-tag {
		font-size: 22rpx;
		color: #667eea;
		background: rgba(102, 126, 234, 0.1);
		padding: 4rpx 12rpx;
		border-radius: 10rpx;
		margin-left: 10rpx;
	}

	.empty-tip {
		text-align: center;
		font-size: 26rpx;
		color: #999;
		padding: 40rpx 0;
	}
</style>