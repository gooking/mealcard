<template>
	<view class="member-page">
		<!-- 用户信息卡片 -->
		<view class="user-card">
			<view class="user-info">
				<image :src="avatar" class="avatar" mode="aspectFill"></image>
				<view class="user-detail">
					<text class="nickname">{{ nickname }}</text>
					<text class="mobile">{{ mobile }}</text>
				</view>
			</view>
			<view class="member-badge">
				<text class="badge-text">{{ memberLevel }}</text>
			</view>
		</view>

		<!-- 余额卡片 -->
		<view class="balance-card">
			<view class="balance-item">
				<text class="balance-value">¥{{ balance }}</text>
				<text class="balance-label">账户余额</text>
			</view>
			<view class="balance-divider"></view>
			<view class="balance-item">
				<text v-if="discount >= 10" class="balance-value">原价</text>
				<text v-else class="balance-value">{{ discount  }}折</text>
				<text class="balance-label">会员折扣</text>
			</view>
		</view>

		<!-- 会员等级 -->
		<view class="member-section">
			<view class="section-header">
				<text class="section-title">会员等级</text>
				<text class="expire-text" v-if="expireDate !== '未开通'">有效期至：{{ expireDate }}</text>
			</view>
			<view class="level-list">
				<view 
					class="level-item" 
					:class="{ active: item.id === currentLevelId }"
					v-for="(item, index) in memberLevels" 
					:key="index"
					@click="handleLevelClick(item)"
				>
					<view class="level-left">
						<view class="level-icon" :style="{ background: item.color }">
							<text class="icon-text">{{ item.icon }}</text>
						</view>
						<view class="level-info">
							<view class="level-name-row">
								<text class="level-name">{{ item.name }}</text>
								<view class="current-tag" v-if="item.id === currentLevelId">
									<text class="tag-text">当前</text>
								</view>
							</view>
							<text class="level-discount">{{ item.discount < 10 ? item.discount + '折优惠' : '无折扣' }}</text>
							<text class="level-desc">{{ item.desc }}</text>
						</view>
					</view>
					<view class="level-right">
						<view class="level-price" v-if="item.price > 0">
							<text class="price-symbol">¥</text>
							<text class="price-value">{{ item.price }}</text>
							<text class="price-unit" v-if="item.unitStr">/{{ item.unitStr }}</text>
						</view>
						<text class="free-text" v-else-if="!item.hasPrices"></text>
						<view class="action-btn" v-if="item.id !== currentLevelId && item.hasPrices">
							<text class="btn-text">立即开通</text>
						</view>
						<view class="default-tag" v-if="item.id !== currentLevelId && !item.hasPrices">
							<text class="tag-text">暂未开放</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 会员权益说明 -->
			<view class="benefits-section">
				<view class="benefits-title">
					<text class="title-text">会员权益</text>
				</view>
				<view class="benefits-list">
					<view class="benefit-item">
						<uni-icons type="checkmarkempty" size="20" color="#667eea"></uni-icons>
						<text class="benefit-text">消费享受对应折扣优惠</text>
					</view>
					<view class="benefit-item">
						<uni-icons type="checkmarkempty" size="20" color="#667eea"></uni-icons>
						<text class="benefit-text">会员有效期内持续享受</text>
					</view>
					<view class="benefit-item">
						<uni-icons type="checkmarkempty" size="20" color="#667eea"></uni-icons>
						<text class="benefit-text">支持续费延长有效期</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-item" @click="goToPage('/pages/messages/messages')">
				<view class="menu-left">
					<uni-icons type="notification" size="24" color="#667eea"></uni-icons>
					<text class="menu-text">消息通知</text>
				</view>
				<view class="menu-right">
					<view class="unread-badge" v-if="unreadCount > 0">
						<text class="badge-text">{{ unreadCount }}</text>
					</view>
					<uni-icons type="forward" size="20" color="#999"></uni-icons>
				</view>
			</view>
			<view class="menu-item" @click="goToPage('/pages/recharge/recharge')">
				<view class="menu-left">
					<uni-icons type="wallet" size="24" color="#667eea"></uni-icons>
					<text class="menu-text">立即充值</text>
				</view>
				<uni-icons type="forward" size="20" color="#999"></uni-icons>
			</view>
			<view class="menu-item" @click="showFeedback">
				<view class="menu-left">
					<uni-icons type="chat" size="24" color="#667eea"></uni-icons>
					<text class="menu-text">意见反馈</text>
				</view>
				<uni-icons type="forward" size="20" color="#999"></uni-icons>
			</view>
			<view class="menu-item" @click="contactService">
				<view class="menu-left">
					<uni-icons type="phone" size="24" color="#667eea"></uni-icons>
					<text class="menu-text">联系客服</text>
				</view>
				<uni-icons type="forward" size="20" color="#999"></uni-icons>
			</view>
		</view>

		<!-- 退出登录 -->
		<view class="logout-section">
			<button class="logout-btn" @click="handleLogout">退出登录</button>
		</view>

		<!-- 意见反馈弹窗 -->
		<view class="feedback-modal" v-if="showFeedbackModal" @click="closeFeedback">
			<view class="feedback-content" @click.stop>
				<view class="feedback-header">
					<text class="feedback-title">意见反馈</text>
					<uni-icons type="closeempty" size="24" color="#999" @click="closeFeedback"></uni-icons>
				</view>
				
				<view class="feedback-body">
					<!-- 手机号 -->
					<view class="feedback-item">
						<text class="item-label">联系电话</text>
						<input 
							class="item-input" 
							v-model="feedbackForm.mobile" 
							type="number"
							maxlength="11"
							placeholder="请输入您的手机号"
						/>
					</view>

					<!-- 反馈内容 -->
					<view class="feedback-item">
						<text class="item-label">反馈内容</text>
						<textarea 
							class="item-textarea" 
							v-model="feedbackForm.content" 
							placeholder="请详细描述您的意见或建议"
							maxlength="500"
						/>
						<text class="char-count">{{ feedbackForm.content.length }}/500</text>
					</view>

					<!-- 图片上传 -->
					<view class="feedback-item">
						<text class="item-label">上传图片（选填）</text>
						<view class="image-list">
							<view 
								class="image-item" 
								v-for="(img, index) in feedbackForm.images" 
								:key="index"
							>
								<image :src="img" mode="aspectFill" class="upload-image"></image>
								<view class="delete-btn" @click="deleteImage(index)">
									<uni-icons type="closeempty" size="16" color="#fff"></uni-icons>
								</view>
							</view>
							<view 
								class="upload-btn" 
								v-if="feedbackForm.images.length < 3"
								@click="chooseImage"
							>
								<uni-icons type="plusempty" size="40" color="#999"></uni-icons>
								<text class="upload-text">上传图片</text>
							</view>
						</view>
						<text class="upload-tip">最多上传3张图片</text>
					</view>
				</view>

				<view class="feedback-footer">
					<button class="cancel-btn" @click="closeFeedback">取消</button>
					<button class="submit-btn" @click="submitFeedback">提交</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import AUTH from '@/common/auth.js'
	
	export default {
		data() {
			return {
				avatar: '/static/default-avatar.svg',
				nickname: '用户',
				mobile: '',
				balance: 0,
				memberLevel: '普通会员',
				discount: 10,
				expireDate: '未开通',
				currentLevelId: 0,
				unreadCount: 0,
				memberLevels: [],
				levelColors: [
					'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)',
					'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
					'linear-gradient(135deg, #a8a8a8 0%, #7a7a7a 100%)',
					'linear-gradient(135deg, #c0c0c0 0%, #909090 100%)',
				],
				showFeedbackModal: false,
				feedbackForm: {
					mobile: '',
					content: '',
					images: []
				}
			}
		},

		onShow() {
			if (this.token) {
				this.loadUserInfo()
				this.loadMemberLevels()
			} else {
				this.goLogin()
			}
		},

		methods: {
			async loadMemberLevels() {
				try {
					const res = await this.$wxapi.userLevelList({
						page: 1,
						pageSize: 50
					})

					if (res.code === 0 && res.data && res.data.result) {
						// 转换API返回的数据格式
						this.memberLevels = res.data.result.map((item, index) => {
							// 获取会员等级名称的第一个字作为图标
							const icon = item.name ? item.name.charAt(0) : '会'
							
							// 根据索引分配颜色
							const color = this.levelColors[index % this.levelColors.length]
							
							// rebate 是折扣，10代表10折（不打折），1代表1折
							const discount = item.rebate || 10

							return {
								id: item.id,
								name: item.name,
								discount: discount,
								price: 0, // 价格需要从收费项目接口获取
								icon: icon,
								color: color,
								level: item.level || 0,
								hasPrices: false // 是否有收费项目
							}
						})

						// 按 level 排序，level 越大等级越高
						this.memberLevels.sort((a, b) => a.level - b.level)

						// 加载每个会员等级的收费项目
						await this.loadMemberPrices()
					}
				} catch (error) {
					console.error('加载会员等级失败', error)
				}
			},

			async loadMemberPrices() {
				// 为每个会员等级加载收费项目（仅用于显示价格）
				for (let i = 0; i < this.memberLevels.length; i++) {
					const level = this.memberLevels[i]
					try {
						const res = await this.$wxapi.userLevelPrices(level.id)
						
						if (res.code === 0 && res.data && res.data.length > 0) {
							// 优先显示年费，其次月费，最后第一个
							const priceItem = res.data.find(item => item.unit === 2) || 
							                  res.data.find(item => item.unit === 1) || 
							                  res.data[0]
							
							if (priceItem) {
								level.price = priceItem.price || 0
								level.duration = priceItem.duration
								level.unit = priceItem.unit
								level.unitStr = priceItem.unitStr
								level.hasPrices = true
							}
						}
					} catch (error) {
						console.error(`加载会员等级 ${level.name} 收费项目失败`, error)
					}
				}
			},

			async loadUserInfo() {
				// 获取用户基本信息
				const userRes = await this.$wxapi.userDetail(this.token)
				if (userRes.code === 0) {
					const userData = userRes.data.base || userRes.data
					this.nickname = userData.nick || '用户'
					this.avatar = userData.avatarUrl || '/static/default-avatar.svg'
					this.mobile = userData.mobile || ''
					
					// 获取会员等级信息
					if (userRes.data.userLevel) {
						const levelData = userRes.data.userLevel
						this.memberLevel = levelData.name || '普通会员'
						this.discount = levelData.rebate || 10
						this.currentLevelId = levelData.id || 0
						
						// 获取会员有效期
						if (userData.levelExpire) {
							this.expireDate = this.formatDate(userData.levelExpire)
						} else if (levelData.defValidityUnit === 3) {
							this.expireDate = '永久有效'
						} else {
							this.expireDate = '未开通'
						}
					}
				}

				// 获取余额
				const balanceRes = await this.$wxapi.userAmount(this.token)
				if (balanceRes.code === 0) {
					this.balance = (balanceRes.data.balance || 0).toFixed(2)
				}
			},

			formatDate(timestamp) {
				const date = new Date(timestamp)
				return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
			},

			async handleLevelClick(level) {
				if (level.id === this.currentLevelId) {
					uni.showToast({
						title: '当前已是该等级',
						icon: 'none'
					})
					return
				}

				// 加载该会员等级的收费项目
				await this.showPriceOptions(level)
			},

			async showPriceOptions(level) {
				uni.showLoading({
					title: '加载中...'
				})

				try {
					const res = await this.$wxapi.userLevelPrices(level.id)
					
					uni.hideLoading()

					if (res.code === 0 && res.data && res.data.length > 0) {
						const priceItems = res.data
						
						// 如果只有一个收费项目，直接显示购买确认
						if (priceItems.length === 1) {
							this.showBuyConfirm(level, priceItems[0])
						} else {
							// 多个收费项目，显示选择列表
							this.showPriceList(level, priceItems)
						}
					} else {
						uni.showToast({
							title: '该会员等级暂无收费项目',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					console.error('加载收费项目失败', error)
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					})
				}
			},

			showPriceList(level, priceItems) {
				// 构建选项列表
				const itemList = priceItems.map(item => {
					const unitMap = {
						0: '天',
						1: '月',
						2: '年'
					}
					const unitStr = item.unitStr || unitMap[item.unit] || ''
					return `¥${item.price} / ${item.duration}${unitStr}`
				})

				uni.showActionSheet({
					title: `选择${level.name}购买方式`,
					itemList: itemList,
					success: (res) => {
						const selectedPrice = priceItems[res.tapIndex]
						this.showBuyConfirm(level, selectedPrice)
					}
				})
			},

			showBuyConfirm(level, priceItem) {
				const unitMap = {
					0: '天',
					1: '月',
					2: '年'
				}
				const unitStr = priceItem.unitStr || unitMap[priceItem.unit] || ''
				const durationText = `${priceItem.duration}${unitStr}`
				
				const content = `${level.name}\n价格：¥${priceItem.price} / ${durationText}\n\n确认购买？`
				
				uni.showModal({
					title: '开通会员',
					content: content,
					confirmText: '立即支付',
					success: async (res) => {
						if (res.confirm) {
							await this.upgradeMember(priceItem)
						}
					}
				})
			},

			async upgradeMember(priceItem) {
				uni.showLoading({
					title: '处理中...'
				})

				try {
					// 使用余额购买会员
					const res = await this.$wxapi.userLevelBuy(this.token, priceItem.id)

					uni.hideLoading()

					if (res.code === 0) {
						uni.showModal({
							content: '购买成功',
							showCancel: false,
							success: () => {
								this.loadUserInfo()
								this.loadMemberLevels()
							}
						})
					} else if (res.code === 20000) {
						// 余额不足，需要充值
						uni.showActionSheet({
							itemList: ['微信支付', '支付宝支付'],
							success: async (res222) => {
								console.log('选中了第' + (res222.tapIndex + 1) + '个按钮');
								// 调起支付 第一个参数传 alipay wxpay 来区分支付宝还是微信支付
								const payRes = await this.$pay.pay(res222.tapIndex == 0 ? 'wxpay' : 'alipay', {}, res.data, '购买会员', '购买会员', {
										type: 6,
										userLevelPriceId: priceItem.id,
										isAutoRenew: false
									},
									(res) => {
										// 支付成功的逻辑
									}, (err) => {
										// 支付失败的逻辑
									}
								)
							},
							fail: (error) => {
								console.log(res.errMsg);
							}
						});
					} else {
						uni.showToast({
							title: res.msg || '购买失败',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					console.error('购买会员失败', error)
					uni.showToast({
						title: '操作失败，请重试',
						icon: 'none'
					})
				}
			},

			goToPage(url) {
				uni.navigateTo({
					url
				})
			},

			showFeedback() {
				this.showFeedbackModal = true
				// 预填手机号
				this.feedbackForm.mobile = this.mobile
			},

			closeFeedback() {
				this.showFeedbackModal = false
				// 重置表单
				this.feedbackForm = {
					mobile: '',
					content: '',
					images: []
				}
			},

			chooseImage() {
				uni.chooseImage({
					count: 3 - this.feedbackForm.images.length,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: async (res) => {
						uni.showLoading({
							title: '上传中...'
						})

						try {
							// 上传所有选中的图片
							for (let i = 0; i < res.tempFilePaths.length; i++) {
								const uploadRes = await this.$wxapi.uploadFileV2(
									this.token,
									res.tempFilePaths[i]
								)

								if (uploadRes.code === 0 && uploadRes.data.url) {
									this.feedbackForm.images.push(uploadRes.data.url)
								}
							}

							uni.hideLoading()
							uni.showToast({
								title: '上传成功',
								icon: 'success'
							})
						} catch (error) {
							uni.hideLoading()
							console.error('上传图片失败', error)
							uni.showToast({
								title: '上传失败',
								icon: 'none'
							})
						}
					}
				})
			},

			deleteImage(index) {
				this.feedbackForm.images.splice(index, 1)
			},

			async submitFeedback() {
				// 验证手机号
				if (!this.feedbackForm.mobile) {
					uni.showToast({
						title: '请输入手机号',
						icon: 'none'
					})
					return
				}

				if (!/^1[3-9]\d{9}$/.test(this.feedbackForm.mobile)) {
					uni.showToast({
						title: '请输入正确的手机号',
						icon: 'none'
					})
					return
				}

				// 验证内容
				if (!this.feedbackForm.content.trim()) {
					uni.showToast({
						title: '请输入反馈内容',
						icon: 'none'
					})
					return
				}

				uni.showLoading({
					title: '提交中...'
				})

				try {
					const feedbackRes = await this.$wxapi.addComment({
						token: this.token,
						type: 1, // 1 意见反馈
						mobile: this.feedbackForm.mobile,
						content: this.feedbackForm.content,
						pics: this.feedbackForm.images
					})

					uni.hideLoading()

					if (feedbackRes.code === 0) {
						uni.showToast({
							title: '提交成功',
							icon: 'success'
						})
						this.closeFeedback()
					} else {
						uni.showToast({
							title: feedbackRes.msg || '提交失败',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					console.error('提交反馈失败', error)
					uni.showToast({
						title: '提交失败，请重试',
						icon: 'none'
					})
				}
			},

			contactService() {
				const phone = this.sysconfigMap.kf_tel || '400-000-0000'
				uni.showModal({
					title: '联系客服',
					content: `客服电话：${phone}`,
					confirmText: '拨打',
					success: (res) => {
						if (res.confirm) {
							// #ifdef MP-WEIXIN
							uni.makePhoneCall({
								phoneNumber: phone
							})
							// #endif
							// #ifdef H5
							uni.setClipboardData({
								data: phone,
								success: () => {
									uni.showToast({
										title: '号码已复制',
										icon: 'success'
									})
								}
							})
							// #endif
							// #ifdef APP-PLUS
							uni.makePhoneCall({
								phoneNumber: phone
							})
							// #endif
						}
					}
				})
			},

			handleLogout() {
				uni.showModal({
					content: '确认退出登录？',
					success: (res) => {
						if (res.confirm) {
							AUTH.loginOut()
							uni.showToast({
								title: '已退出登录',
								icon: 'success'
							})
							
							setTimeout(() => {
								this.goLogin()
							}, 1500)
						}
					}
				})
			},

			goLogin() {
				uni.redirectTo({
					url: '/pages/login/login'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.member-page {
		min-height: 100vh;
		background: #f5f5f5;
		padding-bottom: 30rpx;
	}

	.user-card {
		margin: 30rpx;
		padding: 40rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
	}

	.user-detail {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.nickname {
		font-size: 32rpx;
		font-weight: bold;
		color: #fff;
	}

	.mobile {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.member-badge {
		padding: 10rpx 20rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 20rpx;
		backdrop-filter: blur(10rpx);
	}

	.badge-text {
		font-size: 24rpx;
		color: #fff;
		font-weight: 500;
	}

	.balance-card {
		margin: 30rpx;
		padding: 40rpx;
		background: #fff;
		border-radius: 20rpx;
		display: flex;
		justify-content: space-around;
		align-items: center;
	}

	.balance-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15rpx;
	}

	.balance-value {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
	}

	.balance-label {
		font-size: 24rpx;
		color: #999;
	}

	.balance-divider {
		width: 2rpx;
		height: 80rpx;
		background: #f0f0f0;
	}

	.member-section {
		margin: 30rpx;
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.section-header {
		padding: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.expire-text {
		font-size: 24rpx;
		color: #f5576c;
	}

	.level-list {
		padding: 20rpx 30rpx 30rpx;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.level-item {
		padding: 30rpx;
		border: 2rpx solid #e0e0e0;
		border-radius: 15rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.3s;
	}

	.level-item.active {
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.05);
		box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.15);
	}

	.level-left {
		display: flex;
		align-items: center;
		gap: 20rpx;
		flex: 1;
	}

	.level-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.icon-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #fff;
	}

	.level-info {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		flex: 1;
	}

	.level-name-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.level-name {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.current-tag {
		padding: 4rpx 12rpx;
		background: #667eea;
		border-radius: 8rpx;
	}

	.tag-text {
		font-size: 20rpx;
		color: #fff;
	}

	.level-discount {
		font-size: 24rpx;
		color: #f5576c;
		font-weight: 500;
	}

	.level-desc {
		font-size: 22rpx;
		color: #999;
	}

	.level-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10rpx;
		flex-shrink: 0;
	}

	.level-price {
		display: flex;
		align-items: baseline;
	}

	.price-symbol {
		font-size: 24rpx;
		color: #667eea;
		font-weight: bold;
	}

	.price-value {
		font-size: 36rpx;
		font-weight: bold;
		color: #667eea;
	}

	.price-unit {
		font-size: 22rpx;
		color: #999;
		margin-left: 4rpx;
	}

	.free-text {
		font-size: 28rpx;
		color: #999;
	}

	.action-btn {
		padding: 8rpx 20rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
	}

	.btn-text {
		font-size: 22rpx;
		color: #fff;
	}

	.default-tag {
		padding: 8rpx 20rpx;
		background: #f0f0f0;
		border-radius: 20rpx;
	}

	.default-tag .tag-text {
		font-size: 22rpx;
		color: #999;
	}

	.benefits-section {
		margin-top: 20rpx;
		padding: 30rpx;
		background: #f8f9ff;
		border-top: 1rpx solid #f0f0f0;
	}

	.benefits-title {
		margin-bottom: 20rpx;
	}

	.title-text {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.benefits-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.benefit-item {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.benefit-text {
		font-size: 26rpx;
		color: #666;
	}

	.menu-section {
		margin: 30rpx;
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.menu-item {
		padding: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-left {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.menu-text {
		font-size: 28rpx;
		color: #333;
	}

	.menu-right {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}

	.unread-badge {
		min-width: 36rpx;
		height: 36rpx;
		padding: 0 8rpx;
		background: #f5576c;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.badge-text {
		font-size: 20rpx;
		color: #fff;
		font-weight: bold;
	}

	.logout-section {
		margin: 30rpx;
	}

	.logout-btn {
		width: 100%;
		height: 90rpx;
		line-height: 90rpx;
		background: #fff;
		color: #f5576c;
		border: none;
		border-radius: 45rpx;
		font-size: 30rpx;
	}

	/* 意见反馈弹窗 */
	.feedback-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.feedback-content {
		width: 650rpx;
		max-height: 80vh;
		background: #fff;
		border-radius: 20rpx;
		display: flex;
		flex-direction: column;
	}

	.feedback-header {
		padding: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.feedback-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.feedback-body {
		flex: 1;
		padding: 30rpx;
		overflow-y: auto;
	}

	.feedback-item {
		margin-bottom: 30rpx;
	}

	.item-label {
		display: block;
		font-size: 28rpx;
		color: #333;
		margin-bottom: 15rpx;
		font-weight: 500;
	}

	.item-input {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		background: #f5f5f5;
		border-radius: 10rpx;
		font-size: 28rpx;
		color: #333;
	}

	.item-textarea {
		width: 100%;
		min-height: 200rpx;
		padding: 20rpx;
		background: #f5f5f5;
		border-radius: 10rpx;
		font-size: 28rpx;
		color: #333;
	}

	.char-count {
		display: block;
		text-align: right;
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
	}

	.image-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
	}

	.image-item {
		position: relative;
		width: 160rpx;
		height: 160rpx;
	}

	.upload-image {
		width: 100%;
		height: 100%;
		border-radius: 10rpx;
	}

	.delete-btn {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		width: 40rpx;
		height: 40rpx;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.upload-btn {
		width: 160rpx;
		height: 160rpx;
		background: #f5f5f5;
		border-radius: 10rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
	}

	.upload-text {
		font-size: 24rpx;
		color: #999;
	}

	.upload-tip {
		display: block;
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
	}

	.feedback-footer {
		padding: 30rpx;
		display: flex;
		gap: 20rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.cancel-btn,
	.submit-btn {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 40rpx;
		font-size: 28rpx;
		border: none;
	}

	.cancel-btn {
		background: #f5f5f5;
		color: #666;
	}

	.submit-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}
</style>
