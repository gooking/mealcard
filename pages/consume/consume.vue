<template>
	<view class="consume-page">
		<!-- 余额显示 -->
		<view class="balance-card">
			<text class="balance-label">可用余额</text>
			<text class="balance-amount">¥{{ balance }}</text>
			<text class="member-info">{{ memberLevel }} {{ discount < 1 ? `(${discount * 10}折)` : '' }}</text>
		</view>

		<!-- 付款码 -->
		<view class="code-section">
			<view class="code-card">
				<view class="code-header">
					<text class="code-title">向商家出示此码</text>
					<view class="countdown-wrapper">
						<text class="countdown-text">{{ countdown }}s</text>
						<view class="countdown-ring" :style="{ strokeDashoffset: countdownOffset }"></view>
					</view>
				</view>

				<!-- 二维码 -->
				<view class="qrcode-wrapper" v-if="!isPaused">
					<canvas id="qrcode" canvas-id="qrcode" class="qrcode-canvas"></canvas>
					<view class="code-number">{{ payCode }}</view>
				</view>

				<!-- 暂停状态 -->
				<view class="paused-wrapper" v-else>
					<uni-icons type="locked" size="80" color="#ccc"></uni-icons>
					<text class="paused-text">付款码已暂停</text>
				</view>

				<!-- 操作按钮 -->
				<view class="code-actions">
					<button class="action-btn" @click="togglePause">
						<uni-icons :type="isPaused ? 'play-filled' : 'pause-filled'" size="20" color="#667eea"></uni-icons>
						<text>{{ isPaused ? '恢复' : '暂停' }}</text>
					</button>
					<button class="action-btn" @click="refreshCode" :disabled="isPaused">
						<uni-icons type="reload" size="20" color="#667eea"></uni-icons>
						<text>刷新</text>
					</button>
				</view>
			</view>

			<!-- 安全提示 -->
			<view class="security-tips">
				<uni-icons type="info" size="16" color="#ff9500"></uni-icons>
				<text class="tip-text">付款码30秒自动刷新，截图无效</text>
			</view>
		</view>

		<!-- 最近消费 -->
		<view class="recent-section">
			<view class="section-title">最近消费</view>
			<view class="record-list" v-if="recentRecords.length > 0">
				<view class="record-item" v-for="(item, index) in recentRecords" :key="index">
					<view class="record-info">
						<text v-if="item.type == 0 && item.amount < 0" class="record-shop">消费</text>
						<text v-else class="record-shop">{{ item.typeStr }}</text>
						<text class="record-time">{{ item.dateAdd }}</text>
					</view>
					<text class="record-amount">{{ item.amount }}</text>
				</view>
			</view>
			<view class="empty-tip" v-else>
				<text>暂无消费记录</text>
			</view>
		</view>
	</view>
</template>

<script>
	import UQRCode from '@/uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js';
	import WXAPI from 'apifm-uniapp'
	
	export default {
		data() {
			return {
				balance: 0,
				memberLevel: '普通会员',
				discount: 1,
				payCode: '',
				countdown: 30,
				isPaused: false,
				timer: null,
				countdownTimer: null,
				recentRecords: []
			}
		},

		computed: {
			countdownOffset() {
				const circumference = 2 * Math.PI * 45
				return circumference * (1 - this.countdown / 30)
			},
			
			token() {
				return this.$store.state.token || uni.getStorageSync('token')
			}
		},

		async onLoad() {
			await this.loadUserInfo()
			await this.generatePayCode()
			this.startCountdown()
			await this.loadRecentRecords()
		},

		onUnload() {
			this.clearTimers()
		},

		methods: {
			async loadUserInfo() {
				const res = await this.$wxapi.userAmount(this.token)
				if (res.code === 0) {
					this.balance = res.data.balance || 0
				}

				const memberRes = await this.$wxapi.userDetail(this.token)
				if (memberRes.code === 0 && memberRes.data.level) {
					this.memberLevel = memberRes.data.level.name || '普通会员'
					this.discount = memberRes.data.level.discount || 1
				}
			},

			async generatePayCode() {
				// 调用API获取动态会员码
				try {
					const res = await WXAPI.dynamicUserCode(this.token)
					if (res.code === 0 && res.data) {
						this.payCode = res.data
						
						// 生成二维码
						this.$nextTick(() => {
							this.drawQRCode()
						})
					} else {
						uni.showToast({
							title: res.msg || '获取付款码失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('获取付款码失败:', error)
					uni.showToast({
						title: '获取付款码失败',
						icon: 'none'
					})
				}
			},

			drawQRCode() {
				// 获取uQRCode实例 https://uqrcode.cn/doc/document/uni-app.html#props
				var qr = new UQRCode();
				// 设置二维码内容
				qr.data = this.payCode;
				// 设置二维码大小，必须与canvas设置的宽高一致
				qr.size = 200;
				qr.sizeUnit = 'rpx';
				// 调用制作二维码方法
				qr.make();
				// 获取canvas上下文
				var canvasContext = uni.createCanvasContext('qrcode', this); // 如果是组件，this必须传入
				// 设置uQRCode实例的canvas上下文
				qr.canvasContext = canvasContext;
				// 调用绘制方法将二维码图案绘制到canvas上
				qr.drawCanvas();
			},

			startCountdown() {
				this.countdown = 30
				this.countdownTimer = setInterval(() => {
					if (!this.isPaused) {
						this.countdown--
						if (this.countdown <= 0) {
							this.refreshCode()
						}
					}
				}, 1000)
			},

			async refreshCode() {
				if (this.isPaused) return
				
				await this.generatePayCode()
				this.countdown = 30
			},

			async togglePause() {
				this.isPaused = !this.isPaused
				
				if (this.isPaused) {
					uni.showToast({
						title: '付款码已暂停',
						icon: 'none'
					})
				} else {
					await this.refreshCode()
					uni.showToast({
						title: '付款码已恢复',
						icon: 'none'
					})
				}
			},

			clearTimers() {
				if (this.countdownTimer) {
					clearInterval(this.countdownTimer)
				}
			},

			async loadRecentRecords() {
				try {
					// 使用资金明细列表API，筛选消费类型
					const res = await WXAPI.cashLogsV3({
						token: this.token,
						page: 1,
					})

					if (res.code === 0 && res.data && res.data.result) {
						this.recentRecords = res.data.result
					}
				} catch (error) {
					console.error('加载消费记录失败:', error)
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	.consume-page {
		min-height: 100vh;
		background: #f5f5f5;
	}

	.balance-card {
		margin: 30rpx;
		padding: 40rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
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
		margin-bottom: 10rpx;
	}

	.member-info {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.9);
	}

	.code-section {
		margin: 30rpx;
	}

	.code-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 40rpx;
	}

	.code-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40rpx;
	}

	.code-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.countdown-wrapper {
		position: relative;
		width: 60rpx;
		height: 60rpx;
	}

	.countdown-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 20rpx;
		color: #667eea;
		font-weight: bold;
	}

	.qrcode-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40rpx 0;
	}

	.qrcode-canvas {
		width: 400rpx;
		height: 400rpx;
	}

	.code-number {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		letter-spacing: 4rpx;
	}

	.paused-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 100rpx 0;
	}

	.paused-text {
		font-size: 28rpx;
		color: #999;
		margin-top: 20rpx;
	}

	.code-actions {
		display: flex;
		gap: 20rpx;
		margin-top: 40rpx;
	}

	.action-btn {
		flex: 1;
		height: 80rpx;
		background: #f5f5f5;
		border: none;
		border-radius: 10rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		font-size: 28rpx;
		color: #667eea;
	}

	.action-btn[disabled] {
		opacity: 0.5;
	}

	.security-tips {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-top: 20rpx;
		padding: 20rpx;
		background: #fff9e6;
		border-radius: 10rpx;
	}

	.tip-text {
		font-size: 24rpx;
		color: #ff9500;
	}

	.recent-section {
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

	.record-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.record-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.record-item:last-child {
		border-bottom: none;
	}

	.record-info {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.record-shop {
		font-size: 28rpx;
		color: #333;
	}

	.record-time {
		font-size: 24rpx;
		color: #999;
	}

	.record-amount {
		font-size: 32rpx;
		font-weight: bold;
		color: #f5576c;
	}

	.empty-tip {
		padding: 60rpx 0;
		text-align: center;
		color: #999;
		font-size: 28rpx;
	}
</style>
