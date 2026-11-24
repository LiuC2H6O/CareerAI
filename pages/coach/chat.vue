<template>
	<view class="chat-container">
		<!-- 聊天记录展示区 -->
		<scroll-view 
			class="chat-scroll" 
			scroll-y 
			:scroll-into-view="scrollToId"
			scroll-with-animation
		>
			<view class="chat-list">
				<!-- 欢迎语 -->
				<view class="message-row ai-row">
					<view class="avatar ai-avatar">🤖</view>
					<view class="bubble ai-bubble">
						你好！我是你的专属 AI 就业教练。不论是简历修改、面试技巧还是职业规划，都可以问我哦！
					</view>
				</view>

				<!-- 历史消息循环 -->
				<view 
					v-for="(msg, index) in messageList" 
					:key="index"
					:id="'msg-' + index"
					:class="['message-row', msg.role === 'user' ? 'user-row' : 'ai-row']"
				>
					<view v-if="msg.role === 'assistant'" class="avatar ai-avatar">🤖</view>
					<view :class="['bubble', msg.role === 'user' ? 'user-bubble' : 'ai-bubble']">
						<text>{{ msg.content }}</text>
					</view>
					<view v-if="msg.role === 'user'" class="avatar user-avatar">👤</view>
				</view>

				<!-- 加载中动画 -->
				<view v-if="loading" class="message-row ai-row" id="loading-msg">
					<view class="avatar ai-avatar">🤖</view>
					<view class="bubble ai-bubble loading-bubble">
						<text class="dot">·</text><text class="dot">·</text><text class="dot">·</text> 正在思考
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部输入区 -->
		<view class="input-area">
			<input 
				class="chat-input" 
				v-model="inputText" 
				placeholder="请输入你的求职疑问..." 
				confirm-type="send"
				@confirm="sendMessage"
				:disabled="loading"
			/>
			<button class="send-btn" :class="{ disabled: !inputText || loading }" @click="sendMessage">发送</button>
		</view>
	</view>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const aiService = uniCloud.importObject('ai-service')
const inputText = ref('')
const messageList = ref([]) // 存放聊天记录
const loading = ref(false)
const scrollToId = ref('')

const sendMessage = async () => {
	const text = inputText.value.trim()
	if (!text || loading.value) return

	// 1. 插入用户消息
	messageList.value.push({ role: 'user', content: text })
	inputText.value = ''
	scrollToBottom()

	// 2. 开启 loading
	loading.value = true
	scrollToBottom()

	try {
		// 截取最近 10 条对话传给后端，防止 Token 爆炸
		const contextMessages = messageList.value.slice(-10)
		
		// 3. 调用云对象
		const res = await aiService.chat({
			messages: contextMessages
		})

		if (res.code === 0) {
			// 4. 插入 AI 回复
			messageList.value.push(res.data)
		} else {
			uni.showToast({ title: res.message, icon: 'none' })
		}
	} catch (e) {
		console.error('请求失败', e)
		uni.showToast({ title: '网络异常', icon: 'none' })
	}

	loading.value = false
	scrollToBottom()
}

// 滚动到底部
const scrollToBottom = () => {
	nextTick(() => {
		if (loading.value) {
			scrollToId.value = 'loading-msg'
		} else {
			scrollToId.value = 'msg-' + (messageList.value.length - 1)
		}
	})
}
</script>

<style scoped>
.chat-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #FFF8EE;
}

/* 消息区 */
.chat-scroll {
	flex: 1;
	overflow: hidden;
	height: 0; /* 配合 flex 自适应 */
}

.chat-list {
	padding: 20px;
	padding-bottom: 40px;
}

.message-row {
	display: flex;
	margin-bottom: 20px;
	align-items: flex-start;
}

.user-row {
	justify-content: flex-end;
}

.ai-row {
	justify-content: flex-start;
}

.avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 20px;
	flex-shrink: 0;
}

.ai-avatar {
	background: #FFF4E0;
	margin-right: 10px;
}

.user-avatar {
	background: #E5E5EA;
	margin-left: 10px;
}

.bubble {
	max-width: 70%;
	padding: 12px 16px;
	border-radius: 12px;
	font-size: 15px;
	line-height: 1.5;
	word-break: break-all;
}

.ai-bubble {
	background: #FFFFFF;
	color: #333;
	border-top-left-radius: 2px;
	box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.user-bubble {
	background: #FF8A3D;
	color: #FFFFFF;
	border-top-right-radius: 2px;
}

/* Loading 动画 */
.loading-bubble {
	color: #999;
	font-style: italic;
}
.dot {
	animation: blink 1.4s infinite both;
	font-weight: bold;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }

/* 底部输入区 */
.input-area {
	display: flex;
	align-items: center;
	padding: 10px 15px;
	background: #FFFFFF;
	border-top: 1px solid #EAEAEA;
	padding-bottom: calc(10px + env(safe-area-inset-bottom)); /* 适配全面屏底部 */
}

.chat-input {
	flex: 1;
	height: 40px;
	background: #F2F2F2;
	border-radius: 20px;
	padding: 0 15px;
	font-size: 15px;
}

.send-btn {
	margin-left: 10px;
	background: #FF8A3D;
	color: #fff;
	width: 70px;
	height: 40px;
	line-height: 40px;
	font-size: 15px;
	border-radius: 20px;
	padding: 0;
}

.send-btn.disabled {
	background: #FFB877;
}
</style>