<template>
	<view class="verify-page">
		<!-- 商家信息 -->
		<view class="shop-info">
			<view class="shop-detail">
				<text class="shop-name">{{ shopName }}</text>
				<text class="shop-address">{{ shopAddress }}</text>
			</view>
			<button class="logout-btn" size="mini" @click="handleLogout">退出</button>
		</view>

		<!-- 今日统计 -->
		<view class="today-stats">
			<view class="stat-item">
				<text class="stat-value">{{ todayCount }}</text>
				<text class="stat-label">今日核销</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value">¥{{ todayAmount }}</text>
				<text class="stat-label">今日金额</text>
			</view>
		</view>

		<!-- 核销方式 -->
		<view class="verify-section">
			<view class="section-title">核销方式</view>
			
			<!-- 扫码核销 -->
			<view class="verify-card">
				<view class="card-header">
					<uni-icons type="scan" size="32" color="#667eea"></uni-icons>
					<text class="card-title">扫码核销</text>
				</view>
				<button class="verify-btn scan-btn" @click="scanCode">
					<uni-icons type="scan" size="24" color="#fff"></uni-icons>
					<text>扫描付款码</text>
				</button>
			</view>

			<!-- 手动输入 -->
			<view class="verify-card">
				<view class="card-header">
					<uni-icons type="compose" size="32" color="#667eea"></uni-icons>
					<text class="card-title">手动输入</text>
				</view>
				<view class="input-section">
					<input 
						class="code-input" 
						type="text" 
						v-model="payCode" 
						placeholder="请输入付款码"
						maxlength="18"
					/>
					<input 
						class="amount-input" 
						type="digit" 
						v-model="amount" 
						placeholder="请输入消费金额"
					/>
				</view>
				<button class="verify-btn manual-btn" @click="manualVerify" :disabled="verifying">
					{{ verifying ? '核销中...' : '确认核销' }}
				</button>
			</view>
		</view>

		<!-- 快捷入口 -->
		<view class="quick-menu">
			<view class="menu-item" @click="goToOrders">
				<uni-icons type="list" size="28" color="#667eea"></uni-icons>
				<text class="menu-text">核销记录</text>
			</view>
			<view class="menu-item" @click="goToStatistics">
				<uni-icons type="bars" size="28" color="#667eea"></uni-icons>
				<text class="menu-text">营收统计</text>
			</view>
		</view>

		<!-- 验证码弹窗 -->
		<uni-popup ref="codePopup" type="center">
			<view class="code-popup">
				<view class="popup-title">请输入验证码</view>
				<view class="popup-desc">已向用户手机号发送验证码</view>
				<input 
					class="code-verify-input" 
					type="number" 
					maxlength="6" 
					v-model="verifyCode" 
					placeholder="请输入6位验证码"
				/>
				<view class="popup-actions">
					<button class="popup-btn cancel-btn" @click="cancelVerify">取消</button>
					<button class="popup-btn confirm-btn" @click="confirmVerify" :disabled="confirming">
						{{ confirming ? '确认中...' : '确认' }}
					</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				shopName: '商家店铺',
				shopAddress: '',
				todayCount: 0,
				todayAmount: 0,
				payCode: '',
				amount: '',
				verifyCode: '',
				verifying: false,
				confirming: false,
				currentVerifyData: null
			}
		},

		onShow() {
			this.checkLogin()
			this.loadShopInfo()
			this.loadTodayStats()
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

			loadShopInfo() {
				const merchantInfo = this.$store.state.merchantInfo
				if (merchantInfo) {
					this.shopName = merchantInfo.name || '商家店铺'
					this.shopAddress = merchantInfo.address || ''
				}
			},

			async loadTodayStats() {
				const merchantToken = this.$store.state.merchantToken
				const res = await this.$wxapi.merchantTodayStats({
					token: merchantToken
				})

				if (res.code === 0) {
					this.todayCount = res.data.count || 0
					this.todayAmount = res.data.amount || 0
				}
			},

			scanCode() {
				uni.scanCode({
					success: (res) => {
						this.payCode = res.result
						this.showAmountInput()
					},
					fail: (err) => {
						console.error(err)
						uni.showToast({
							title: '扫码失败',
							icon: 'none'
						})
					}
				})
			},

			showAmountInput() {
				uni.showModal({
					title: '输入消费金额',
					editable: true,
					placeholderText: '请输入金额',
					success: (res) => {
						if (res.confirm && res.content) {
							this.amount = res.content
							this.startVerify()
						}
					}
				})
			},

			manualVerify() {
				if (!this.payCode) {
					uni.showToast({
						title: '请输入付款码',
						icon: 'none'
					})
					return
				}

				if (!this.amount || parseFloat(this.amount) <= 0) {
					uni.showToast({
						title: '请输入正确的金额',
						icon: 'none'
					})
					return
				}

				this.startVerify()
			},

			async startVerify() {
				this.verifying = true

				const merchantToken = this.$store.state.merchantToken
				
				// 发起核销请求，系统会向用户发送验证码
				const res = await this.$wxapi.merchantVerifyStart({
					token: merchantToken,
					payCode: this.payCode,
					amount: this.amount
				})

				this.verifying = false

				if (res.code === 0) {
					// 保存核销数据
					this.currentVerifyData = {
						verifyId: res.data.verifyId,
						userMobile: res.data.userMobile
					}

					// 显示验证码输入弹窗
					this.$refs.codePopup.open()
					
					uni.showToast({
						title: '验证码已发送',
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: res.msg || '核销失败',
						icon: 'none'
					})
				}
			},

			cancelVerify() {
				this.$refs.codePopup.close()
				this.verifyCode = ''
				this.currentVerifyData = null
			},

			async confirmVerify() {
				if (!this.verifyCode || this.verifyCode.length !== 6) {
					uni.showToast({
						title: '请输入6位验证码',
						icon: 'none'
					})
					return
				}

				this.confirming = true

				const merchantToken = this.$store.state.merchantToken
				
				// 确认核销
				const res = await this.$wxapi.merchantVerifyConfirm({
					token: merchantToken,
					verifyId: this.currentVerifyData.verifyId,
					verifyCode: this.verifyCode
				})

				this.confirming = false

				if (res.code === 0) {
					uni.showToast({
						title: '核销成功',
						icon: 'success'
					})

					// 关闭弹窗
					this.$refs.codePopup.close()

					// 清空输入
					this.payCode = ''
					this.amount = ''
					this.verifyCode = ''
					this.currentVerifyData = null

					// 刷新统计
					this.loadTodayStats()
				} else {
					uni.showToast({
						title: res.msg || '核销失败',
						icon: 'none'
					})
				}
			},

			goToOrders() {
				uni.navigateTo({
					url: '/pages/merchant/orders'
				})
			},

			goToStatistics() {
				uni.navigateTo({
					url: '/pages/merchant/statistics'
				})
			},

			handleLogout() {
				uni.showModal({
					title: '提示',
					content: '确认退出登录？',
					success: (res) => {
						if (res.confirm) {
							this.vuex('merchantToken', '')
							this.vuex('merchantInfo', null)
							
							uni.redirectTo({
								url: '/pages/merchant/login'
							})
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.verify-page {
		min-height: 100vh;
		background: #f5f5f5;
		padding-bottom: 30rpx;
	}

	.shop-info {
		padding: 30rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.shop-detail {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.shop-name {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}

	.shop-address {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.logout-btn {
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
		border: none;
	}

	.today-stats {
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
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
	}

	.stat-label {
		font-size: 24rpx;
		color: #999;
	}

	.stat-divider {
		width: 2rpx;
		height: 80rpx;
		background: #f0f0f0;
	}

	.verify-section {
		margin: 30rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.verify-card {
		margin-bottom: 30rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 20rpx;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 15rpx;
		margin-bottom: 30rpx;
	}

	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.verify-btn {
		width: 100%;
		height: 90rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15rpx;
		border: none;
		border-radius: 15rpx;
		font-size: 30rpx;
		font-weight: bold;
	}

	.scan-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}

	.manual-btn {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
		color: #fff;
	}

	.verify-btn[disabled] {
		opacity: 0.6;
	}

	.input-section {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		margin-bottom: 30rpx;
	}

	.code-input,
	.amount-input {
		height: 80rpx;
		padding: 0 20rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 10rpx;
		font-size: 28rpx;
	}

	.quick-menu {
		margin: 30rpx;
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.menu-item {
		padding: 30rpx;
		display: flex;
		align-items: center;
		gap: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-text {
		font-size: 28rpx;
		color: #333;
	}

	.code-popup {
		width: 600rpx;
		padding: 40rpx;
		background: #fff;
		border-radius: 20rpx;
	}

	.popup-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		text-align: center;
		margin-bottom: 15rpx;
	}

	.popup-desc {
		font-size: 24rpx;
		color: #999;
		text-align: center;
		margin-bottom: 30rpx;
	}

	.code-verify-input {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 10rpx;
		font-size: 32rpx;
		text-align: center;
		letter-spacing: 10rpx;
		margin-bottom: 30rpx;
	}

	.popup-actions {
		display: flex;
		gap: 20rpx;
	}

	.popup-btn {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		border: none;
		border-radius: 10rpx;
		font-size: 28rpx;
	}

	.cancel-btn {
		background: #f5f5f5;
		color: #666;
	}

	.confirm-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}

	.confirm-btn[disabled] {
		opacity: 0.6;
	}
</style>
