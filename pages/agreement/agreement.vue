<template>
	<view class="agreement-page">
		<view class="agreement-content">
			<view class="agreement-title">{{ title }}</view>
			<view class="agreement-body">
				<mp-html v-if="content" :content="content" />
				<view v-else class="loading-text">加载中...</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				key: '',
				title: '',
				content: ''
			}
		},

		onLoad(options) {
			this.key = options.key || ''
			this.loadAgreement()
		},

		methods: {
			async loadAgreement() {
				if (!this.key) {
					uni.showToast({
						title: '参数错误',
						icon: 'none'
					})
					return
				}

				uni.showLoading({
					title: '加载中...'
				})

				try {
					const res = await this.$wxapi.cmsPage(this.key)
					
					uni.hideLoading()

					if (res.code === 0 && res.data && res.data.info) {
						this.title = res.data.info.title || (this.key === 'yhxy' ? '用户协议' : '隐私条款')
						this.content = res.data.info.content || ''
					} else {
						uni.showToast({
							title: '加载失败',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.agreement-page {
		min-height: 100vh;
		background: #F7F8FA;
	}

	.agreement-content {
		padding: 40rpx;
	}

	.agreement-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		text-align: center;
		margin-bottom: 40rpx;
	}

	.agreement-body {
		background: #fff;
		border-radius: 16rpx;
		padding: 40rpx;
		line-height: 1.8;
		font-size: 28rpx;
		color: #666;
	}

	.loading-text {
		text-align: center;
		color: #999;
		padding: 60rpx 0;
	}
</style>
