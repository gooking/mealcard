<template>
	<view class="merchant-login-page">
		<view class="login-container">
			<view class="logo-section">
				<uni-icons type="shop" size="80" color="#667eea"></uni-icons>
				<text class="app-name">商家端</text>
				<text class="app-desc">饭卡系统管理后台</text>
			</view>

			<view class="form-section">
				<view class="input-group">
					<view class="input-label">商家账号</view>
					<input class="input-field" v-model="username" placeholder="请输入商家账号" />
				</view>

				<view class="input-group">
					<view class="input-label">登录密码</view>
					<input class="input-field" type="password" v-model="password" placeholder="请输入登录密码" />
				</view>

				<button class="login-btn" @click="handleLogin" :disabled="logging">
					{{ logging ? '登录中...' : '登录' }}
				</button>
			</view>

			<view class="tips">
				<text class="tip-text">商家账号由系统管理员创建</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				username: '',
				password: '',
				logging: false
			}
		},

		methods: {
			async handleLogin() {
				if (!this.username) {
					uni.showToast({
						title: '请输入商家账号',
						icon: 'none'
					})
					return
				}

				if (!this.password) {
					uni.showToast({
						title: '请输入登录密码',
						icon: 'none'
					})
					return
				}

				this.logging = true

				// 调用商家登录API
				const res = await this.$wxapi.merchantLogin({
					username: this.username,
					password: this.password
				})

				this.logging = false

				if (res.code === 0) {
					// 保存商家token和信息
					this.vuex('merchantToken', res.data.token)
					this.vuex('merchantInfo', res.data.shopInfo)

					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})

					setTimeout(() => {
						uni.redirectTo({
							url: '/pages/merchant/verify'
						})
					}, 1500)
				} else {
					uni.showToast({
						title: res.msg || '登录失败',
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.merchant-login-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.login-container {
		width: 90%;
		max-width: 600rpx;
	}

	.logo-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 80rpx;
	}

	.app-name {
		font-size: 48rpx;
		font-weight: bold;
		color: #fff;
		margin-top: 30rpx;
	}

	.app-desc {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 15rpx;
	}

	.form-section {
		background: #fff;
		border-radius: 20rpx;
		padding: 50rpx 40rpx;
	}

	.input-group {
		margin-bottom: 40rpx;
	}

	.input-label {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 15rpx;
		font-weight: 500;
	}

	.input-field {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 10rpx;
		font-size: 28rpx;
	}

	.login-btn {
		width: 100%;
		height: 90rpx;
		line-height: 90rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
		border-radius: 45rpx;
		font-size: 32rpx;
		font-weight: bold;
		margin-top: 20rpx;
	}

	.login-btn[disabled] {
		opacity: 0.6;
	}

	.tips {
		display: flex;
		justify-content: center;
		margin-top: 40rpx;
	}

	.tip-text {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}
</style>
