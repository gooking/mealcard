// QRCode for uni-app
// 简化版二维码生成库

function QRCode(canvasId, options) {
	this.canvasId = canvasId
	this.options = options || {}
	this.text = this.options.text || ''
	this.width = this.options.width || 200
	this.height = this.options.height || 200
	this.colorDark = this.options.colorDark || '#000000'
	this.colorLight = this.options.colorLight || '#ffffff'
	
	if (this.text) {
		this.makeCode(this.text)
	}
}

QRCode.prototype.makeCode = function(text) {
	this.text = text
	this.draw()
}

QRCode.prototype.draw = function() {
	const ctx = uni.createCanvasContext(this.canvasId)
	const size = 25 // 二维码模块数量
	const cellSize = this.width / size
	
	// 绘制背景
	ctx.fillStyle = this.colorLight
	ctx.fillRect(0, 0, this.width, this.height)
	
	// 简化版：绘制随机模块（实际应用中应使用完整的二维码算法）
	ctx.fillStyle = this.colorDark
	
	// 绘制定位图案（左上、右上、左下）
	this.drawPositionPattern(ctx, 0, 0, cellSize)
	this.drawPositionPattern(ctx, size - 7, 0, cellSize)
	this.drawPositionPattern(ctx, 0, size - 7, cellSize)
	
	// 绘制数据模块（简化版）
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			// 跳过定位图案区域
			if ((row < 9 && col < 9) || 
				(row < 9 && col > size - 9) || 
				(row > size - 9 && col < 9)) {
				continue
			}
			
			// 根据文本生成伪随机模块
			const hash = this.simpleHash(this.text + row + col)
			if (hash % 2 === 0) {
				ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
			}
		}
	}
	
	ctx.draw()
}

QRCode.prototype.drawPositionPattern = function(ctx, startRow, startCol, cellSize) {
	// 外框 7x7
	for (let i = 0; i < 7; i++) {
		for (let j = 0; j < 7; j++) {
			if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
				ctx.fillRect((startCol + j) * cellSize, (startRow + i) * cellSize, cellSize, cellSize)
			}
		}
	}
}

QRCode.prototype.simpleHash = function(str) {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash) + str.charCodeAt(i)
		hash = hash & hash
	}
	return Math.abs(hash)
}

QRCode.CorrectLevel = {
	L: 1,
	M: 0,
	Q: 3,
	H: 2
}

export default QRCode
