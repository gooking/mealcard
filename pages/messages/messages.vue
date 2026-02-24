<template>
	<view class="messages-page">
		<!-- 消息列表 -->
		<view class="messages-list">
			<view 
				class="message-item" 
				:class="{ unread: !item.isRead }"
				v-for="(item, index) in messages" 
				:key="index"
				@click="readMessage(item, index)"
			>
				<view class="message-icon" :class="getIconClass(item.type)">
					<uni-icons :type="getIconType(item.type)" size="28" color="#fff"></uni-icons>
				</view>
				<view class="message-content">
					<view class="message-header">
						<text class="message-title">{{ item.title }}</text>
						<text class="message-time">{{ formatTime(item.dateAdd) }}</text>
					</view>
					<text class="message-text">{{ item.content }}</text>
				</view>
			</view>

			<view class="empty-tip" v-if="messages.length === 0">
				<uni-icons type="info" size="60" color="#ccc"></uni-icons>
				<text class="empty-text">暂无消息</text>
			</view>
		</view>

		<!-- 公告详情弹窗 -->
		<view class="notice-modal" v-if="showModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ currentNotice.title }}</text>
					<view class="close-btn" @click="closeModal">
						<uni-icons type="closeempty" size="24" color="#666"></uni-icons>
					</view>
				</view>
				<scroll-view class="modal-body" scroll-y>
					<mp-html v-if="currentNotice.content" :content="currentNotice.content" />
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				messages: [],
				page: 1,
				showModal: false,
				currentNotice: {
					title: '',
					content: ''
				}
			}
		},

		onLoad() {
			this.loadMessages()
		},
		onReachBottom() {
			this.page++
			this.loadMessages()
		},
		methods: {
			async loadMessages() {
				uni.showLoading({
					title: ''
				})
				// https://www.yuque.com/apifm/nu0f75/zanb9r
				const res = await this.$wxapi.noticeList({
					page: this.page
				})
				uni.hideLoading()
				if (res.code == 0) {
					if(this.page == 1) {
						this.messages = res.data.dataList
					} else {
						this.messages = this.messages.concat(res.data.dataList)
					}
				}
			},

			async readMessage(item, index) {
				uni.showLoading({
					title: '加载中'
				})
				// https://www.yuque.com/apifm/nu0f75/zanb9r
				const res = await this.$wxapi.noticeDetail(item.id)
				uni.hideLoading()
				
				if (res.code === 0 && res.data) {
					this.currentNotice = {
						title: res.data.title || item.title,
						content: res.data.content || ''
					}
					this.showModal = true
				} else {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			},

			closeModal() {
				this.showModal = false
			},

			deleteMessage(item, index) {
				uni.showModal({
					title: '提示',
					content: '确认删除此消息？',
					success: (res) => {
						if (res.confirm) {
							this.messages.splice(index, 1)
							
							// 调用API删除消息
							// this.$wxapi.deleteMessage({ token: this.token, messageId: item.id })
							
							uni.showToast({
								title: '已删除',
								icon: 'success'
							})
						}
					}
				})
			},

			markAllRead() {
				this.messages.forEach(item => {
					item.isRead = true
				})

				// 调用API标记全部已读
				// this.$wxapi.markAllMessagesRead({ token: this.token })

				uni.showToast({
					title: '已全部标记为已读',
					icon: 'success'
				})
			},

			clearAll() {
				uni.showModal({
					title: '提示',
					content: '确认清空所有消息？',
					success: (res) => {
						if (res.confirm) {
							this.messages = []
							
							// 调用API清空消息
							// this.$wxapi.clearAllMessages({ token: this.token })
							
							uni.showToast({
								title: '已清空',
								icon: 'success'
							})
						}
					}
				})
			},

			getIconType(type) {
				const iconMap = {
					recharge: 'wallet',
					consume: 'cart',
					member: 'vip',
					system: 'info'
				}
				return iconMap[type] || 'info'
			},

			getIconClass(type) {
				const classMap = {
					recharge: 'icon-recharge',
					consume: 'icon-consume',
					member: 'icon-member',
					system: 'icon-system'
				}
				return classMap[type] || 'icon-system'
			},

			formatTime(timestamp) {
				const date = new Date(timestamp)
				const now = new Date()
				const diff = now - date

				if (diff < 60000) {
					return '刚刚'
				} else if (diff < 3600000) {
					return `${Math.floor(diff / 60000)}分钟前`
				} else if (diff < 86400000) {
					return `${Math.floor(diff / 3600000)}小时前`
				} else if (diff < 172800000) {
					return '昨天'
				} else {
					const month = String(date.getMonth() + 1).padStart(2, '0')
					const day = String(date.getDate()).padStart(2, '0')
					return `${month}-${day}`
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.messages-page {
		min-height: 100vh;
		background: #f5f5f5;
		padding-bottom: 150rpx;
	}

	.messages-list {
		padding: 30rpx;
	}

	.message-item {
		margin-bottom: 20rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 15rpx;
		display: flex;
		align-items: flex-start;
		gap: 20rpx;
		position: relative;
	}

	.message-item.unread {
		background: #f8f9ff;
	}

	.message-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.icon-recharge {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.icon-consume {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.icon-member {
		background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
	}

	.icon-system {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}

	.message-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.message-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		padding-right: 16rpx;
	}

	.message-time {
		flex-shrink: 0;
		font-size: 22rpx;
		color: #999;
	}

	.message-text {
		font-size: 26rpx;
		color: #666;
		line-height: 1.6;
	}

	.message-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20rpx;
	}

	.unread-badge {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: #f5576c;
	}

	.empty-tip {
		padding: 150rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}

	.bottom-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 30rpx;
		background: #fff;
		box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
		display: flex;
		gap: 20rpx;
	}

	.action-btn {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		background: #667eea;
		color: #fff;
		border: none;
		border-radius: 10rpx;
		font-size: 28rpx;
	}

	.action-btn.danger {
		background: #f5576c;
	}

	/* 公告详情弹窗 */
	.notice-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
		padding: 60rpx;
	}

	.modal-content {
		width: 100%;
		max-height: 80vh;
		background: #fff;
		border-radius: 20rpx;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: modalSlideIn 0.3s ease-out;
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(50rpx);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		padding: 40rpx 30rpx 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
	}

	.modal-title {
		flex: 1;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		padding-right: 40rpx;
		line-height: 1.4;
	}

	.close-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.modal-body {
		flex: 1;
		padding: 30rpx;
		overflow-y: auto;
		box-sizing: border-box;
	}

	.modal-body ::v-deep img {
		max-width: 100% !important;
		height: auto !important;
		border-radius: 10rpx;
		margin: 10rpx 0;
	}

	.modal-body ::v-deep p {
		margin: 15rpx 0;
		line-height: 1.8;
		color: #666;
		font-size: 28rpx;
	}

	.modal-body ::v-deep h1,
	.modal-body ::v-deep h2,
	.modal-body ::v-deep h3 {
		margin: 20rpx 0 15rpx;
		color: #333;
		font-weight: bold;
	}

	.modal-body ::v-deep h1 {
		font-size: 36rpx;
	}

	.modal-body ::v-deep h2 {
		font-size: 32rpx;
	}

	.modal-body ::v-deep h3 {
		font-size: 30rpx;
	}

	.modal-body ::v-deep ul,
	.modal-body ::v-deep ol {
		padding-left: 40rpx;
		margin: 15rpx 0;
	}

	.modal-body ::v-deep li {
		margin: 10rpx 0;
		line-height: 1.6;
		color: #666;
		font-size: 28rpx;
	}

	.modal-body ::v-deep a {
		color: #667eea;
		text-decoration: underline;
	}

	.modal-body ::v-deep blockquote {
		padding: 20rpx;
		margin: 15rpx 0;
		background: #f8f9fa;
		border-left: 6rpx solid #667eea;
		border-radius: 6rpx;
	}

	.modal-body ::v-deep code {
		padding: 4rpx 8rpx;
		background: #f5f5f5;
		border-radius: 4rpx;
		font-family: monospace;
		font-size: 26rpx;
		color: #e83e8c;
	}

	.modal-body ::v-deep pre {
		padding: 20rpx;
		margin: 15rpx 0;
		background: #f5f5f5;
		border-radius: 8rpx;
		overflow-x: auto;
	}

	.modal-body ::v-deep table {
		width: 100%;
		border-collapse: collapse;
		margin: 15rpx 0;
	}

	.modal-body ::v-deep th,
	.modal-body ::v-deep td {
		padding: 15rpx;
		border: 1rpx solid #e0e0e0;
		font-size: 26rpx;
	}

	.modal-body ::v-deep th {
		background: #f8f9fa;
		font-weight: bold;
		color: #333;
	}

	.modal-body ::v-deep td {
		color: #666;
	}
</style>
