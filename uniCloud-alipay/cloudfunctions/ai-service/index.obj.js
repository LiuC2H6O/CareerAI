// 云对象：ai-service
const db = uniCloud.database()

// 智谱 GLM 的配置
const API_KEY = process.env.AI_API_KEY
// 修复：原文件使用了 API_URL / MODEL_NAME 但未定义，这里补齐配置并支持环境变量覆盖
const API_URL = process.env.AI_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const MODEL_NAME = process.env.AI_MODEL_NAME || 'glm-4-flash'

// 封装请求大模型的通用函数（用于简历诊断，强制返回JSON）
async function callLLM(messages) {

	try {
		const res = await uniCloud.httpclient.request(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`
			},
			data: {
				model: MODEL_NAME,
				messages: messages,
				temperature: 0.7,
				response_format: {
					type: 'json_object'
				}
			},
			contentType: 'json',
			dataType: 'json',
			timeout: 60000
		})

		if (res.status !== 200) {
			throw new Error(`AI 接口请求失败: ${res.status} - ${JSON.stringify(res.data)}`)
		}

		return res.data.choices[0].message.content
	} catch (e) {
		console.error('HTTP请求报错：', e)
		throw new Error('网络请求失败，请检查网络或稍后再试')
	}
}

// 将综合职业画像转换成给大模型的提示词文本
function buildProfilePrompt(profile) {
	if (!profile || typeof profile !== 'object') return ''
	const parts = []

	const profileData = profile.profile || profile

	// 性格画像
	if (profileData.mbti && profileData.mbti.type) {
		parts.push('性格画像：' + profileData.mbti.type + '，' +
			(profileData.mbti.typeProfile || '') +
			(profileData.mbti.summary || ''))
	}

	// 兴趣画像
	if (profileData.holland && profileData.holland.ranking &&
		profileData.holland.ranking.length) {
		parts.push('兴趣画像（霍兰德）：' + profileData.holland.ranking
			.slice(0, 3).map(x => x.name).join('、'))
	}

	// 能力画像
	if (profileData.ability && profileData.ability.dimensions &&
		profileData.ability.dimensions.length) {
		parts.push('能力画像：' + profileData.ability.dimensions
			.map(x => x.name + x.rate + '%').join('，'))
	}

	// 价值画像
	if (profileData.value && profileData.value.ranking &&
		profileData.value.ranking.length) {
		parts.push('价值偏好：' + profileData.value.ranking
			.slice(0, 3).map(x => x.name).join('、'))
	}

	// 推荐方向
	if (Array.isArray(profile.careerDirections) &&
		profile.careerDirections.length) {
		parts.push('值得探索的方向：' + profile.careerDirections
			.map(x => x.name).join('、'))
	}

	// 能力差距
	if (profile.abilityGap && profile.abilityGap.gaps &&
		profile.abilityGap.gaps.length) {
		parts.push('主要能力差距：' + profile.abilityGap.gaps
			.slice(0, 3).map(x => x.name + '（差距' + x.gap + '分）').join('，'))
	}

	return parts.join('\n')
}

module.exports = {
	// 1. AI 简历诊断
	async resumeAnalysis(data) {
		const clientInfo = this.getClientInfo()
		const userId = clientInfo.uid || 'test_user_001'

		if (!data.text || data.text.length < 20) {
			return {
				code: 400,
				message: '简历内容太短，请至少输入20个字'
			}
		}

		const prompt = `
你是一名资深的 HR 和职业规划师。请针对以下大学生的简历文本进行诊断。
目标岗位：${data.targetJob || '未指定'}
简历文本："""${data.text}"""
请严格按以下 JSON 格式输出，不要输出任何其他解释性文字：
{
  "advantages": ["优势1", "优势2"],
  "disadvantages": ["不足1", "不足2"],
  "suggestions": ["修改建议1", "修改建议2"]
}
`
		const messages = [{
				role: 'system',
				content: '你是一个严谨、专业的简历分析助手，只输出合法的JSON。'
			},
			{
				role: 'user',
				content: prompt
			}
		]

		try {
			const aiResponse = await callLLM(messages)

			let resultData
			try {
				let cleanText = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim()
				cleanText = cleanText.replace(/,\s*([\]}])/g, '$1')
				resultData = JSON.parse(cleanText)
			} catch (e) {
				console.error('AI 返回格式不是 JSON，原文如下：\n', aiResponse)
				return {
					code: 500,
					message: 'AI 返回格式异常，请重试'
				}
			}

			const now = Date.now()
			await db.collection('ai_records').add({
				user_id: userId,
				type: 'resume_analysis',
				input_summary: data.text.substring(0, 50) + '...',
				result: resultData,
				model: MODEL_NAME,
				created_at: now
			})

			return {
				code: 0,
				data: resultData
			}
		} catch (e) {
			console.error('AI 调用失败:', e)
			return {
				code: 500,
				message: e.message || 'AI 服务暂时不可用'
			}
		}
	},
	// 4. AI 就业教练自由对话
	async chat(data) {
		// data.messages 是一个数组，格式如：[{role:'user', content:'你好'}, {role:'assistant', content:'你好！'}]
		const userMessages = data.messages || []

		// 构造系统提示词，赋予 AI 教练人设
		const systemPrompt = {
			role: 'system',
			content: '你是一名专业、耐心、懂大学生的资深就业教练。请用亲切的语气解答学生在求职、简历、面试、职业规划等方面的疑问。回答要条理清晰，字数控制在300字以内。'
		}

		// 将人设和用户的历史对话合并（为了节省Token，这里可以限制只传最近10条，当前暂不限制）
		const messages = [systemPrompt, ...userMessages]

		try {
			// 这里使用 uniCloud.httpclient 请求大模型
			const res = await uniCloud.httpclient.request(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${API_KEY}`
				},
				data: {
					model: MODEL_NAME,
					messages: messages,
					temperature: 0.7 // 聊天可以稍微自由一点
				},
				contentType: 'json',
				dataType: 'json',
				timeout: 60000
			})

			if (res.status !== 200) {
				throw new Error(`请求失败: ${res.status}`)
			}

			// 获取 AI 的纯文本回复
			const replyContent = res.data.choices[0].message.content

			return {
				code: 0,
				data: {
					role: 'assistant',
					content: replyContent
				}
			}
		} catch (e) {
			console.error('AI 对话失败:', e)
			return {
				code: 500,
				message: 'AI 思考失败，请稍后再试'
			}
		}
	},
	// 5. AI 错题解释
	async explainQuestion(data) {
		const prompt = `
		你是一名耐心、专业的大学老师。学生在做就业能力测评（逻辑思维）时答错了一道题。
		题目：${data.question}
		学生的选择：${data.userAnswer}
		正确答案：${data.correctAnswer}
		
		请用通俗易懂的语言为学生解释：
		1. 为什么他选的是错的？
		2. 正确答案为什么是对的？
		3. 涉及到的核心知识点是什么？
		字数控制在200字以内，直接输出解析文本即可，不需要任何客套话。
		`
		const messages = [{
			role: 'user',
			content: prompt
		}]

		try {
			const res = await uniCloud.httpclient.request(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${API_KEY}`
				},
				data: {
					model: MODEL_NAME,
					messages: messages,
					temperature: 0.6
				},
				contentType: 'json',
				dataType: 'json',
				timeout: 60000
			})

			if (res.status !== 200) {
				throw new Error(`请求失败: ${res.status}`)
			}
			return {
				code: 0,
				data: res.data.choices[0].message.content
			}
		} catch (e) {
			console.error('生成解析失败:', e)
			return {
				code: 500,
				message: 'AI 解析失败，请稍后再试'
			}
		}
	},

	// 2. 生成面试问题
	async interviewQuestion(data) {
		const prompt = `你是一名专业的面试官，正在面试【${data.targetJob || '前端开发'}】岗位的应届生。请提出一个经典的面试问题，只需输出问题本身，不要任何客套话。`
		const messages = [{
			role: 'user',
			content: prompt
		}]

		try {
			// 这里不使用 callLLM，因为不需要强制返回 JSON
			const res = await uniCloud.httpclient.request(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${API_KEY}`
				},
				data: {
					model: MODEL_NAME,
					messages: messages,
					temperature: 0.8
				},
				contentType: 'json',
				dataType: 'json',
				timeout: 60000
			})

			if (res.status !== 200) {
				throw new Error(`请求失败: ${res.status}`)
			}
			return {
				code: 0,
				data: res.data.choices[0].message.content
			}
		} catch (e) {
			console.error('生成问题失败:', e)
			return {
				code: 500,
				message: '生成问题失败'
			}
		}
	},

	// 3. 评估面试回答
	async interviewFeedback(data) {
		const prompt = `
你是一名资深面试官。候选人正在面试【前端开发】岗位。
面试问题：${data.question}
候选人回答：${data.answer}

请对该回答进行评估，严格按以下 JSON 格式输出，不要其他解释：
{
  "score": 85,
  "highlights": ["亮点1", "亮点2"],
  "suggestions": ["改进建议1", "改进建议2"]
}
`
		const messages = [{
				role: 'system',
				content: '你是一个严谨的面试官，只输出合法的JSON。'
			},
			{
				role: 'user',
				content: prompt
			}
		]

		try {
			const aiResponse = await callLLM(messages) // 复用带 JSON 容错的函数
			let cleanText = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim()
			cleanText = cleanText.replace(/,\s*([\]}])/g, '$1')
			const resultData = JSON.parse(cleanText)
			return {
				code: 0,
				data: resultData
			}
		} catch (e) {
			console.error('面试反馈解析失败', e)
			return {
				code: 500,
				message: 'AI 评估失败'
			}
		}
	},
	// 10. AI 职业教练：基于综合职业画像给出个性化建议
	async careerCoach(data = {}) {
		const clientInfo = this.getClientInfo()
		const userId = clientInfo.uid || clientInfo.userId || 'test_user_001'

		const question = (data.question || '').trim()
		const profile = data.profile || {}

		if (!question) {
			return {
				code: 400,
				message: '请先输入你想咨询的问题'
			}
		}

		// 将综合画像压缩成文本提示词
		const profileText = buildProfilePrompt(profile)

		const systemPrompt = {
			role: 'system',
			content: '你是一名专业、温暖且务实的 AI 职业教练，擅长帮助大学生把测评结果转化为可执行的职业行动。回答要具体、有条理，多用小标题或分点，字数控制在 400 字以内。不要编造测评数据，不要使用测评代码作为唯一依据。'
		}

		const userContent = [
			profileText ?
			'以下是该学生的综合职业画像（仅供参考）：\n' + profileText :
			'该学生尚未生成综合职业画像。',
			'学生的问题是：' + question,
			'请结合画像信息给出有针对性的建议。'
		].join('\n\n')

		const messages = [systemPrompt, {
			role: 'user',
			content: userContent
		}]

		try {
			const res = await uniCloud.httpclient.request(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${API_KEY}`
				},
				data: {
					model: MODEL_NAME,
					messages: messages,
					temperature: 0.7
				},
				contentType: 'json',
				dataType: 'json',
				timeout: 60000
			})

			if (res.status !== 200) {
				throw new Error(`请求失败: ${res.status}`)
			}

			const reply = res.data.choices[0].message.content

			// 记录到 ai_records，供成长档案时间轴展示
			try {
				await db.collection('ai_records').add({
					user_id: userId,
					type: 'career_coach',
					input_summary: question.substring(0, 50),
					result: {
						question: question,
						answer: reply
					},
					model: MODEL_NAME,
					created_at: Date.now()
				})
			} catch (recordErr) {
				console.error('记录 AI 教练对话失败:', recordErr)
			}

			return {
				code: 0,
				data: {
					role: 'assistant',
					content: reply
				}
			}
		} catch (e) {
			console.error('AI 职业教练调用失败:', e)
			return {
				code: 500,
				message: 'AI 教练暂时无法回答，请稍后再试'
			}
		}
	},

	// 9. 获取职业探索页聚合数据
	async getExploreData() {
		const clientInfo = this.getClientInfo()
		const userId = clientInfo.uid || 'test_user_001'

		// 1. 获取档案
		const profileRes = await db.collection('user_profiles').where({
			user_id: userId
		}).get()
		const profile = profileRes.data[0] || null

		// 2. 获取能力数据（按分数降序，只取前3）
		const skillsRes = await db.collection('user_skills').where({
			user_id: userId
		}).orderBy('score', 'desc').limit(3).get()

		// 3. 获取推荐的岗位（默认取前3个启用的岗位，如果有匹配逻辑也可以放这里算）
		const jobsRes = await db.collection('career_jobs').where({
			status: 'active'
		}).limit(3).get()

		return {
			code: 0,
			data: {
				profile: profile,
				topSkills: skillsRes.data || [],
				recommendedJobs: jobsRes.data || []
			}
		}
	}
}