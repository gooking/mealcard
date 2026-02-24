<template>
	<view class="recharge-page">
		<!-- 当前余额 -->
		<view class="balance-card">
			<text class="balance-label">当前余额</text>
			<text class="balance-amount">¥{{ balance }}</text>
		</view>

		<!-- 充值金额选择 -->
		<view class="amount-section">
			<view class="section-title">选择充值金额</view>
			<view class="amount-grid">
				<view 
					class="amount-item" 
					:class="{ active: selectedAmount === item.amount }"
					v-for="(item, index) in rechargeOptions" 
					:key="index"
					@click="selectAmount(item.amount)"
				>
					<text class="amount-value">¥{{ item.amount }}</text>
					<text class="gift-text" v-if="item.gift > 0">送{{ item.gift }}元</text>
				</view>
			</view>

			<!-- 自定义金额 -->
			<view class="custom-amount">
				<text class="custom-label">自定义金额</text>
				<input 
					class="custom-input" 
					type="digit" 
					v-model="customAmount" 
					placeholder="请输入金额"
					@input="onCustomInput"
				/>
			</view>
		</view>

		<!-- 充值说明 -->
		<view class="tips-section">
			<view class="tips-title">充值说明</view>
			<view class="tips-content">
				<text class="tip-item">• 充值金额实时到账</text>
				<text class="tip-item">• 赠送金额同步到账</text>
				<text class="tip-item">• 充值记录可在"记录"中查看</text>
				<text class="tip-item">• 如有疑问请联系客服</text>
			</view>
		</view>

		<!-- 充值按钮 -->
		<view class="bottom-bar">
			<view class="total-info">
				<text class="total-label">实付金额</text>
				<text class="total-amount">¥{{ payAmount }}</text>
			</view>
			<button class="recharge-btn" @click="handleRecharge" :disabled="!payAmount || recharging">
				{{ recharging ? '充值中...' : '立即充值' }}
			</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				balance: 0,
				selectedAmount: 0,
				customAmount: '',
				recharging: false,
				rechargeOptions: []
			}
		},

		computed: {
			payAmount() {
				return this.selectedAmount || parseFloat(this.customAmount) || 0
			},
		},

		async onLoad() {
			this.loadBalance()
			this.loadRechargeRules()
		},

		methods: {
			async loadBalance() {
				const res = await this.$wxapi.userAmount(this.token)
				if (res.code === 0) {
					this.balance = res.data.balance || 0
				}
			},
			
			async loadRechargeRules() {
				try {
					const res = await this.$wxapi.rechargeSendRules()
					if (res.code === 0 && res.data) {
						// 将API返回的规则转换为充值选项
						this.rechargeOptions = res.data.map(rule => ({
							amount: rule.confine,
							gift: rule.send,
							loop: rule.loop,
							confine: rule.confine,
							send: rule.send
						}))
						
						// 如果没有规则，添加默认选项
						if (this.rechargeOptions.length === 0) {
							this.rechargeOptions = [
								{ amount: 50, gift: 0, loop: false, confine: 50, send: 0 },
								{ amount: 100, gift: 0, loop: false, confine: 100, send: 0 },
								{ amount: 200, gift: 0, loop: false, confine: 200, send: 0 }
							]
						}
					}
				} catch (error) {
					console.error('加载充值规则失败:', error)
					// 加载失败时使用默认选项
					this.rechargeOptions = [
						{ amount: 50, gift: 0, loop: false, confine: 50, send: 0 },
						{ amount: 100, gift: 0, loop: false, confine: 100, send: 0 },
						{ amount: 200, gift: 0, loop: false, confine: 200, send: 0 }
					]
				}
			},

			selectAmount(amount) {
				this.selectedAmount = amount
				this.customAmount = ''
			},

			onCustomInput() {
				this.selectedAmount = 0
			},

			async handleRecharge() {
				if (!this.payAmount) {
					uni.showToast({
						title: '请选择或输入充值金额',
						icon: 'none'
					})
					return
				}

				if (this.payAmount < 1) {
					uni.showToast({
						title: '充值金额不能小于1元',
						icon: 'none'
					})
					return
				}

				this.recharging = true
				uni.showActionSheet({
					itemList: ['微信支付', '支付宝支付'],
					success: async (res) => {
						console.log('选中了第' + (res.tapIndex + 1) + '个按钮');
						// 调起支付 第一个参数传 alipay wxpay 来区分支付宝还是微信支付
						const payRes = await this.$pay.pay(res.tapIndex == 0 ? 'wxpay' : 'alipay', {}, this.payAmount, '在线充值', '在线充值', null,
							(res) => {
								// 支付成功的逻辑
							}, (err) => {
								// 支付失败的逻辑
								this.recharging = false
							}
						)
					},
					fail: (error) => {
						console.log(res.errMsg);
						this.recharging = false
					}
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.recharge-page {
		min-height: 100vh;
		background: #f5f5f5;
		padding-bottom: 200rpx;
	}

	.balance-card {
		margin: 30rpx;
		padding: 50rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.balance-label {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 15rpx;
	}

	.balance-amount {
		font-size: 60rpx;
		font-weight: bold;
		color: #fff;
	}

	.amount-section {
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

	.amount-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20rpx;
		margin-bottom: 30rpx;
	}

	.amount-item {
		padding: 30rpx 20rpx;
		border: 2rpx solid #e0e0e0;
		border-radius: 15rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.amount-item.active {
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.1);
	}

	.amount-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 10rpx;
	}

	.gift-text {
		font-size: 22rpx;
		color: #f5576c;
		background: #ffe0e6;
		padding: 4rpx 12rpx;
		border-radius: 10rpx;
	}

	.custom-amount {
		display: flex;
		align-items: center;
		padding-top: 30rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.custom-label {
		font-size: 28rpx;
		color: #333;
		margin-right: 20rpx;
		white-space: nowrap;
	}

	.custom-input {
		flex: 1;
		height: 70rpx;
		padding: 0 20rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 10rpx;
		font-size: 28rpx;
	}

	.tips-section {
		margin: 30rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 20rpx;
	}

	.tips-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.tips-content {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.tip-item {
		font-size: 24rpx;
		color: #666;
		line-height: 1.6;
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		padding: 20rpx 30rpx;
		box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.total-info {
		display: flex;
		flex-direction: column;
	}

	.total-label {
		font-size: 24rpx;
		color: #666;
		margin-bottom: 5rpx;
	}

	.total-amount {
		font-size: 36rpx;
		font-weight: bold;
		color: #f5576c;
	}

	.gift-info {
		font-size: 22rpx;
		color: #667eea;
		margin-top: 5rpx;
	}

	.recharge-btn {
		width: 300rpx;
		height: 80rpx;
		line-height: 80rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
		border-radius: 40rpx;
		font-size: 30rpx;
		font-weight: bold;
	}

	.recharge-btn[disabled] {
		opacity: 0.6;
	}
</style>
