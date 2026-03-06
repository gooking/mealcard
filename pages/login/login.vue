<template>
	<view class="login-page">
		<view class="header-section">
			<view class="logo-wrapper">
				<image src="/static/default-avatar.svg" class="logo" mode="aspectFit"></image>
			</view>
			<text class="app-title">饭卡系统</text>
			<text class="app-subtitle">便捷充值 · 轻松消费</text>
		</view>

		<view class="form-container">
			<view class="input-item">
				<view class="input-icon">📱</view>
				<input 
					class="input-box" 
					type="number" 
					maxlength="11" 
					v-model="mobile" 
					placeholder="请输入手机号" 
					placeholder-class="input-placeholder"
				/>
			</view>

			<view class="input-item">
				<view class="input-icon">⿻</view>
				<input 
					class="input-box captcha-input" 
					type="number" 
					maxlength="4" 
					v-model="picCode" 
					placeholder="请输入图形验证码"
					placeholder-class="input-placeholder"
				/>
				<image 
					class="captcha-img" 
					:src="captchaUrl" 
					mode="aspectFit"
					@click="refreshCaptcha"
				></image>
			</view>

			<view class="input-item">
				<view class="input-icon">🔐</view>
				<input 
					class="input-box code-input" 
					type="number" 
					maxlength="6" 
					v-model="code" 
					placeholder="请输入验证码"
					placeholder-class="input-placeholder"
				/>
				<view class="code-btn" :class="{ disabled: codeSending || countdown > 0 }" @click="sendCode">
					{{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
				</view>
			</view>

			<button class="login-btn" @click="handleLogin" :disabled="logging">
				{{ logging ? '登录中...' : '立即登录' }}
			</button>

			<view class="test-account-box">
				<view class="test-account-title">
					<text class="test-icon">🔧</text>
					<text class="test-text">测试账号</text>
				</view>
				<view class="test-account-info" @click="fillTestAccount">
					<text class="test-label">手机号：</text>
					<text class="test-value">13500000000</text>
					<text class="click-hint">👆 点击填入</text>
				</view>
				<view class="test-account-tip">验证码可随意填写</view>
			</view>

			<view class="agreement-box">
				<text class="agreement-text">登录即表示同意</text>
				<text class="agreement-link" @click="openAgreement('yhxy')">《用户协议》</text>
				<text class="agreement-text">和</text>
				<text class="agreement-link" @click="openAgreement('ysxy')">《隐私条款》</text>
			</view>
		</view>
	</view>
</template>

<script>
	import WXAPI from 'apifm-uniapp'
	
	export default {
		data() {
			return {
				mobile: '',
				code: '',
				picCode: '',
				captchaKey: '',
				captchaUrl: '',
				codeSending: false,
				countdown: 0,
				logging: false,
				timer: null
			}
		},

		onLoad() {
			this.refreshCaptcha()
		},

		onUnload() {
			if (this.timer) {
				clearInterval(this.timer)
			}
		},

		methods: {
			// 刷新图形验证码
			refreshCaptcha() {
				this.captchaKey = 'login_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
				this.captchaUrl = WXAPI.graphValidateCodeUrl(this.captchaKey)
				this.picCode = ''
			},

			async sendCode() {
				if (!this.mobile) {
					uni.showToast({
						title: '请输入手机号',
						icon: 'none'
					})
					return
				}

				if (!/^1[3-9]\d{9}$/.test(this.mobile)) {
					uni.showToast({
						title: '手机号格式不正确',
						icon: 'none'
					})
					return
				}

				if (!this.picCode) {
					uni.showToast({
						title: '请输入图形验证码',
						icon: 'none'
					})
					return
				}

				this.codeSending = true
				
				// 调用API发送验证码（带图形验证码）
				const res = await WXAPI.smsValidateCode(this.mobile, this.captchaKey, this.picCode)
				
				this.codeSending = false

				if (res.code === 0) {
					uni.showToast({
						title: '验证码已发送',
						icon: 'success'
					})
					
					// 开始倒计时
					this.countdown = 60
					this.timer = setInterval(() => {
						this.countdown--
						if (this.countdown <= 0) {
							clearInterval(this.timer)
						}
					}, 1000)
				} else {
					uni.showToast({
						title: res.msg || '发送失败',
						icon: 'none'
					})
					// 验证码错误时刷新图形验证码
					this.refreshCaptcha()
				}
			},

			async handleLogin() {
				if (!this.mobile) {
					uni.showToast({
						title: '请输入手机号',
						icon: 'none'
					})
					return
				}

				if (!this.code) {
					uni.showToast({
						title: '请输入验证码',
						icon: 'none'
					})
					return
				}

				this.logging = true

				// 调用API工厂SDK的短信验证码登录方法
				const res = await WXAPI.loginMobileSmsCode({
					mobile: this.mobile,
					code: this.code,
					autoReg: true
				})

				this.logging = false

				if (res.code === 0) {
					// 保存token
					this.vuex('token', res.data.token)
					this.vuex('uid', res.data.uid)
					this.vuex('mobile', this.mobile)

					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})

					setTimeout(() => {
						uni.switchTab({
							url: '/pages/index/index'
						})
					}, 1500)
				} else {
					uni.showToast({
						title: res.msg || '登录失败',
						icon: 'none'
					})
				}
			},

			openAgreement(key) {
				uni.navigateTo({
					url: `/pages/agreement/agreement?key=${key}`
				})
			},

			fillTestAccount() {
				this.mobile = '13500000000'
				uni.showToast({
					title: '已填入测试账号',
					icon: 'success',
					duration: 1500
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.login-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #FF6B35 0%, #FF8C42 100%);
		padding: 0 60rpx;
		box-sizing: border-box;
	}

	.header-section {
		padding-top: 120rpx;
		text-align: center;
		margin-bottom: 80rpx;
	}

	.logo-wrapper {
		width: 160rpx;
		height: 160rpx;
		background: #fff;
		border-radius: 50%;
		margin: 0 auto 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
	}

	.logo {
		width: 100rpx;
		height: 100rpx;
	}

	.app-title {
		display: block;
		font-size: 56rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 16rpx;
		letter-spacing: 4rpx;
	}

	.app-subtitle {
		display: block;
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.9);
		letter-spacing: 2rpx;
	}

	.form-container {
		background: #fff;
		border-radius: 32rpx;
		padding: 60rpx 40rpx 50rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
	}

	.input-item {
		display: flex;
		align-items: center;
		background: #F7F8FA;
		border-radius: 16rpx;
		padding: 0 24rpx;
		margin-bottom: 24rpx;
		height: 96rpx;
	}

	.input-icon {
		font-size: 36rpx;
		margin-right: 16rpx;
	}

	.input-box {
		flex: 1;
		height: 96rpx;
		font-size: 30rpx;
		color: #333;
	}

	.input-placeholder {
		color: #999;
	}

	.captcha-input {
		flex: 1;
		min-width: 0;
	}

	.captcha-img {
		flex-shrink: 0;
		width: 180rpx;
		height: 70rpx;
		margin-left: 16rpx;
		border-radius: 8rpx;
		background: #f0f0f0;
	}

	.code-input {
		flex: 1;
		min-width: 0;
	}

	.code-btn {
		flex-shrink: 0;
		padding: 0 24rpx;
		height: 60rpx;
		line-height: 60rpx;
		background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
		color: #fff;
		border-radius: 30rpx;
		font-size: 24rpx;
		text-align: center;
		margin-left: 16rpx;
	}

	.code-btn.disabled {
		background: #E5E5E5;
		color: #999;
	}

	.login-btn {
		width: 100%;
		height: 96rpx;
		line-height: 96rpx;
		background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
		color: #fff;
		border: none;
		border-radius: 48rpx;
		font-size: 32rpx;
		font-weight: bold;
		margin-top: 40rpx;
		box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.3);
	}

	.login-btn[disabled] {
		opacity: 0.6;
		box-shadow: none;
	}

	.agreement-box {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 40rpx;
		padding: 0 20rpx;
	}

	.agreement-text {
		font-size: 24rpx;
		color: #999;
	}

	.agreement-link {
		font-size: 24rpx;
		color: #FF6B35;
		margin: 0 4rpx;
	}

	.test-account-box {
		margin-top: 32rpx;
		padding: 24rpx;
		background: linear-gradient(135deg, #FFF5F0 0%, #FFF8F5 100%);
		border-radius: 16rpx;
		border: 2rpx dashed #FFB89A;
	}

	.test-account-title {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
	}

	.test-icon {
		font-size: 28rpx;
		margin-right: 8rpx;
	}

	.test-text {
		font-size: 26rpx;
		color: #FF6B35;
		font-weight: bold;
	}

	.test-account-info {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8rpx;
		padding: 12rpx 20rpx;
		background: #fff;
		border-radius: 12rpx;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
	}

	.test-account-info:active {
		transform: scale(0.98);
		background: #FFF8F5;
	}

	.test-label {
		font-size: 26rpx;
		color: #666;
	}

	.test-value {
		font-size: 28rpx;
		color: #333;
		font-weight: bold;
		letter-spacing: 1rpx;
		margin-right: 12rpx;
	}

	.click-hint {
		font-size: 22rpx;
		color: #FF6B35;
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-4rpx);
		}
		60% {
			transform: translateY(-2rpx);
		}
	}

	.test-account-tip {
		text-align: center;
		font-size: 24rpx;
		color: #999;
	}
</style>
