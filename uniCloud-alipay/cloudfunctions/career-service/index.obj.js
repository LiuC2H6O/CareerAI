
'use strict'

const assessmentBank = require('./assessment-bank')
const db = uniCloud.database()
const dbCmd = db.command

const TEST_CONFIG = [
	{ test_code: 'mbti', title: 'MBTI性格偏好测试', description: '探索性格偏好、沟通方式与决策倾向', question_count: 32, duration: '约8分钟' },
	{ test_code: 'holland', title: '霍兰德职业兴趣测试', description: '探索现实、研究、艺术、社会、企业和常规六种兴趣', question_count: 36, duration: '约8分钟' },
	{ test_code: 'ability', title: '职业能力测试', description: '了解逻辑推理、数字分析、语言理解、信息处理和问题解决能力', question_count: 25, duration: '约10分钟' },
	{ test_code: 'value', title: '职业价值观测试', description: '探索稳定、成长、收入、创造、人际和成就等职业价值偏好', question_count: 24, duration: '约6分钟' }
]

const TEST_CODES = TEST_CONFIG.map(x => x.test_code)

const MBTI_OPPOSITE = {
	E: 'I', I: 'E',
	S: 'N', N: 'S',
	T: 'F', F: 'T',
	J: 'P', P: 'J'
}

const MBTI_PAIRS = {
	EI: ['E', 'I'],
	SN: ['S', 'N'],
	TF: ['T', 'F'],
	JP: ['J', 'P']
}

const MBTI_NAMES = {
	E: '外向偏好',
	I: '内向偏好',
	S: '实感偏好',
	N: '直觉偏好',
	T: '思考偏好',
	F: '情感偏好',
	J: '判断偏好',
	P: '知觉偏好'
}

const HOLLAND_NAMES = {
	R: '现实型（动手实践）',
	I: '研究型（分析探索）',
	A: '艺术型（创意表达）',
	S: '社会型（助人合作）',
	E: '企业型（组织影响）',
	C: '常规型（秩序整理）'
}

const VALUE_NAMES = {
	stability: '工作稳定',
	growth: '成长发展',
	income: '收入回报',
	creativity: '创造自主',
	relationship: '人际关系',
	achievement: '成就价值'
}

const ABILITY_NAMES = {
	logical: '逻辑推理',
	numerical: '数字分析',
	verbal: '语言理解',
	information: '信息处理',
	problem: '问题解决'
}

// ============================================================
// 综合职业画像 · 推荐算法素材（新增，不影响原有评分逻辑）
// ============================================================

const MBTI_WORK_STYLES = {
	E: '倾向于在团队互动中获取能量，适合沟通、协作、倡导类工作场景。',
	I: '倾向于通过独立思考恢复精力，适合专注研究、深度分析与独立负责的任务。',
	S: '关注现实事实与具体细节，适合流程明确、标准清晰、可操作性强的任务。',
	N: '关注整体图景与未来可能，适合创新、规划、探索与概念性任务。',
	T: '以逻辑与客观标准做决策，适合分析、判断、技术类工作。',
	F: '重视人际感受与个人价值，适合服务、协调、支持与人文类工作。',
	J: '偏好计划与确定性，适合目标明确、节奏可控、需要推进落地的工作。',
	P: '偏好灵活与开放性，适合变化较快、需要探索多种可能的工作。'
}

const MBTI_TYPE_PROFILES = {
	ISTJ: '严谨务实、重视规则与责任，适合流程管理、财务审计、质量管控等岗位。',
	ISFJ: '耐心细致、乐于服务，适合行政支持、教育辅导、客户关怀等岗位。',
	INFJ: '洞察力强、重视意义，适合心理咨询、人才发展、内容策划等岗位。',
	INTJ: '战略思考、独立果断，适合研发、算法、产品规划、数据分析等岗位。',
	ISTP: '动手能力强、冷静灵活，适合设备运维、工程实施、技术排查等岗位。',
	ISFP: '温和有审美、偏好自主，适合设计、创意、艺术表达等岗位。',
	INFP: '理想主义、重视价值，适合内容创作、用户研究、公益类等岗位。',
	INTP: '逻辑严密、热爱探究，适合科研、技术研究、系统分析等岗位。',
	ESTP: '行动力强、善于应变，适合销售、商务拓展、现场运营等岗位。',
	ESFP: '热情外向、善于带动气氛，适合市场活动、客户成功、教育培训等岗位。',
	ENFP: '富有创意、善于连接人与想法，适合品牌策划、产品运营、创意产业等岗位。',
	ENTP: '思维活跃、喜欢挑战，适合创业、商业分析、策略咨询等岗位。',
	ESTJ: '执行力强、善于组织，适合项目管理、运营管理、团队带领等岗位。',
	ESFJ: '热心合群、重视协作，适合人力资源、客户服务、社群运营等岗位。',
	ENTJ: '目标导向、善于统筹，适合管理岗位、战略规划、创业等方向。',
	ENFJ: '富有感染力、善于激励，适合教育、培训、公共关系、领导力岗位。'
}

const ABILITY_TRAITS = {
	logical: '逻辑推理与归纳演绎',
	numerical: '数字运算与量化分析',
	verbal: '语言理解与文字表达',
	information: '信息整理与数据处理',
	problem: '问题拆解与方案制定'
}

const ABILITY_ADVICE = {
	logical: '每天练习 1-2 道逻辑推理题，重点复盘推理链条与结论依据。',
	numerical: '结合生活场景练习百分比、比率与简单统计，提升数字敏感度与计算准确性。',
	verbal: '坚持阅读与复述练习，训练抓取关键信息、归纳要点与清晰表达的能力。',
	information: '用表格与清单整理资料，练习分类、核对与快速检索，养成规范记录习惯。',
	problem: '遇到任务先拆解目标与约束，列出备选方案并评估取舍，事后复盘决策过程。'
}

// 五项能力 -> 成长雷达六维编码（修复雷达无法记录的关键映射）
const ABILITY_TO_RADAR = {
	logical: 'logic',
	numerical: 'digital',
	verbal: 'communication',
	information: 'professional',
	problem: 'practice'
}

const RADAR_SKILL_NAMES = {
	professional: '专业基础',
	logic: '逻辑思维',
	communication: '沟通表达',
	digital: '数字技能',
	practice: '实践能力',
	career: '求职能力'
}

// 职业方向推荐库
const JOB_CATEGORY_LIBRARY = [
	{
		code: 'tech',
		name: '技术研发与数据',
		holland: ['I', 'R', 'C'],
		mbti: ['I', 'T', 'N', 'J'],
		values: ['growth', 'achievement', 'income'],
		abilities: { logic: 0.3, digital: 0.3, professional: 0.2, practice: 0.2 },
		jobs: ['后端开发工程师', '数据分析师', '测试工程师', '算法工程师']
	},
	{
		code: 'creative',
		name: '产品设计与创意',
		holland: ['A', 'I', 'E'],
		mbti: ['N', 'F', 'P', 'E'],
		values: ['creativity', 'growth', 'achievement'],
		abilities: { communication: 0.25, practice: 0.25, professional: 0.25, logic: 0.25 },
		jobs: ['产品经理', 'UI/UX设计师', '内容策划', '视觉设计师']
	},
	{
		code: 'business',
		name: '市场运营与商务',
		holland: ['E', 'S', 'A'],
		mbti: ['E', 'F', 'P', 'T'],
		values: ['income', 'achievement', 'relationship'],
		abilities: { communication: 0.35, practice: 0.25, digital: 0.2, career: 0.2 },
		jobs: ['新媒体运营', '市场专员', '商务拓展', '客户成功']
	},
	{
		code: 'service',
		name: '教育咨询与服务',
		holland: ['S', 'E', 'C'],
		mbti: ['F', 'E', 'J', 'S'],
		values: ['relationship', 'stability', 'achievement'],
		abilities: { communication: 0.35, professional: 0.25, practice: 0.2, career: 0.2 },
		jobs: ['教育培训', '咨询顾问', '人力资源', '客户支持']
	},
	{
		code: 'operations',
		name: '行政财务与流程',
		holland: ['C', 'R', 'E'],
		mbti: ['S', 'J', 'T', 'I'],
		values: ['stability', 'income', 'relationship'],
		abilities: { digital: 0.3, professional: 0.3, logic: 0.2, practice: 0.2 },
		jobs: ['财务专员', '行政管理', '数据录入与整理', '流程专员']
	},
	{
		code: 'people',
		name: '人力资源与组织',
		holland: ['S', 'E', 'C'],
		mbti: ['F', 'E', 'J', 'N'],
		values: ['relationship', 'growth', 'stability'],
		abilities: { communication: 0.35, professional: 0.25, practice: 0.25, career: 0.15 },
		jobs: ['招聘专员', '培训发展', '员工关系', '组织发展助理']
	}
]

function levelOfScore(score) {
	const n = Number(score) || 0
	if (n >= 80) return { level: '优势', tone: 'strong' }
	if (n >= 60) return { level: '良好', tone: 'good' }
	return { level: '待提升', tone: 'weak' }
}

/**
 * 职业方向推荐算法：综合霍兰德、MBTI、能力、价值观打分。
 */
function recommendCareerDirections(profileData) {
	const mbti = profileData.mbti || {}
	const holland = profileData.holland || {}
	const ability = profileData.ability || {}
	const value = profileData.value || {}

	const abilityScores = {}
	;(ability.dimensions || []).forEach(item => {
		const radarCode = ABILITY_TO_RADAR[item.code]
		if (radarCode) abilityScores[radarCode] = Number(item.rate) || 0
	})

	const hollandTop = (holland.ranking || []).slice(0, 3)
	const valueTop = (value.ranking || []).slice(0, 3)
	const type = mbti.type || ''

	const scored = JOB_CATEGORY_LIBRARY.map(category => {
		const reasons = []
		const components = []

		if (hollandTop.length) {
			let interestRaw = 0
			hollandTop.forEach((item, index) => {
				if (category.holland.includes(item.code)) {
					interestRaw += [1, 0.65, 0.35][index]
					reasons.push('兴趣倾向「' + item.name + '」与该方向契合')
				}
			})
			components.push({ weight: 0.3, value: Math.min(interestRaw / 2, 1) })
		}

		let abilityWeightSum = 0
		let abilityRaw = 0
		Object.keys(category.abilities).forEach(code => {
			const weight = category.abilities[code]
			abilityWeightSum += weight
			abilityRaw += (abilityScores[code] || 0) * weight
		})
		if (abilityWeightSum) {
			components.push({ weight: 0.35, value: abilityRaw / abilityWeightSum / 100 })
		}

		if (type) {
			let matchCount = 0
			type.split('').forEach(letter => {
				if (category.mbti.includes(letter)) matchCount++
			})
			components.push({ weight: 0.15, value: matchCount / 4 })
			if (matchCount >= 3) {
				reasons.push('性格偏好（' + type + '）适合该方向的工作节奏')
			}
		}

		if (valueTop.length) {
			let valueRaw = 0
			valueTop.forEach((item, index) => {
				if (category.values.includes(item.code)) {
					valueRaw += [1, 0.65, 0.35][index]
					reasons.push('你重视「' + item.name + '」，该方向可提供相应空间')
				}
			})
			components.push({ weight: 0.2, value: Math.min(valueRaw / 2, 1) })
		}

		const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)
		const score = totalWeight
			? Math.round(components.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight * 100)
			: 0

		return {
			code: category.code,
			name: category.name,
			score: score,
			jobs: category.jobs,
			reasons: reasons.slice(0, 4),
			requiredAbilities: Object.keys(category.abilities).map(code => ({
				code: code,
				name: RADAR_SKILL_NAMES[code] || code,
				weight: category.abilities[code]
			}))
		}
	})

	return scored.sort((a, b) => b.score - a.score).slice(0, 4)
}

/**
 * 个人能力差距分析。
 */
function buildAbilityGapAnalysis(directions, abilityScores) {
	const target = directions && directions[0]
	if (!target) {
		return {
			target: null,
			gaps: [],
			overall: 0,
			summary: '尚缺少足够的测评数据，完成测评后即可查看能力差距。'
		}
	}

	const gaps = target.requiredAbilities.map(item => {
		const current = Number(abilityScores[item.code])
		const hasScore = !isNaN(current)
		const level = hasScore ? levelOfScore(current) : { level: '未提供', tone: 'missing' }
		const gap = hasScore ? Math.max(0, 75 - current) : 75
		return {
			code: item.code,
			name: item.name,
			weight: item.weight,
			current: hasScore ? current : null,
			target: 75,
			gap: gap,
			level: level.level,
			tone: level.tone
		}
	}).sort((a, b) => b.gap - a.gap)

	const overall = gaps.length
		? Math.round(gaps.reduce((sum, g) => sum + (g.current === null ? 0 : g.current), 0) / gaps.length)
		: 0

	return {
		target: { code: target.code, name: target.name },
		gaps: gaps,
		overall: overall,
		summary: gaps.length
			? '与「' + target.name + '」方向相比，' +
				(gaps[0].gap > 0
					? '「' + gaps[0].name + '」当前差距最大，建议优先提升。'
					: '各项能力均已达到参考水平，可进一步向实践应用深入。')
			: '暂无足够数据生成差距分析。'
	}
}

function ok(data, message = '操作成功') {
	return {
		code: 0,
		message: message,
		data: data
	}
}

function fail(message, code = 1) {
	return {
		code: code,
		message: message,
		data: null
	}
}

/**
 * 使用 auth-service 的 verifySession 验证 token。
 * 不接受客户端直接传入的 user_id。
 */
async function getAssessmentUser(token) {
	if (!token || typeof token !== 'string') {
		throw new Error('请先登录')
	}

	const authService = uniCloud.importObject('auth-service')
	const result = await authService.verifySession(token)

	if (!result || result.code !== 0 || !result.data) {
		throw new Error(
			result && result.message
				? result.message
				: '登录状态已失效'
		)
	}

	const userId =
		result.data.userId ||
		result.data.user_id ||
		result.data.uid ||
		result.data._id

	if (!userId) {
		throw new Error('无法确认当前用户身份')
	}

	return String(userId)
}

/**
 * 兼容项目早期未传 token 的旧页面接口。
 * 不使用默认测试用户。
 */
function getLegacyUserId(context) {
	const info = context &&
		typeof context.getClientInfo === 'function'
		? context.getClientInfo()
		: {}

	const userId = info && (info.uid || info.userId)

	if (!userId) {
		throw new Error('当前接口需要登录身份，请先登录')
	}

	return String(userId)
}

/**
 * 统一用户身份解析（修复能力雷达无法记录的核心问题）。
 *
 * 写入接口（submitNewAssessment 等）使用 getAssessmentUser(token) 得到的
 * userId 是 auth-service.verifySession 返回的 user._id；
 * 而旧的读取接口使用 getLegacyUserId() 取 getClientInfo().uid，
 * 项目使用自定义 token 会话而非 uni-id，uid 通常为空，导致读取失败。
 *
 * 这里统一为：优先用 token 验证（与写入一致），无 token 时回退旧逻辑，
 * 保证原有调用方式仍然可用，不破坏任何旧功能。
 *
 * 用法：await resolveUserId(this, token)
 */
async function resolveUserId(context, token) {
	if (token && typeof token === 'string') {
		return await getAssessmentUser(token)
	}
	return getLegacyUserId(context)
}

/**
 * 过滤题库数据。
 * 不向前端返回正确答案。
 */
function publicQuestion(q) {
	return {
		question_id: q.question_id,
		test_code: q.test_code,
		sort: q.sort,
		title: q.title || q.question,
		question: q.question || q.title,
		dimension: q.dimension,
		options: (q.options || []).map(o => ({
			value: o.value,
			label: o.label || o.text || String(o.value)
		}))
	}
}

/**
 * 校验答案格式。
 */
function validateAnswer(q, answer) {
	if (q.test_code === 'ability') {
		return ['A', 'B', 'C', 'D'].includes(String(answer))
	}

	const n = Number(answer)

	return Number.isInteger(n) && n >= 1 && n <= 5
}

/**
 * 云端评分。
 * 所有分数均由服务端根据题库和答案重新计算。
 */
function scoreAssessment(testCode, questions, answerMap) {

	// ==================== MBTI评分 ====================
	if (testCode === 'mbti') {
		const scores = {
			EI: { E: 0, I: 0 },
			SN: { S: 0, N: 0 },
			TF: { T: 0, F: 0 },
			JP: { J: 0, P: 0 }
		}

		questions.forEach(q => {
			const n = Number(answerMap[q.question_id])

			if (!scores[q.dimension] || !MBTI_OPPOSITE[q.polarity]) {
				throw new Error('MBTI题目维度配置错误')
			}

			scores[q.dimension][q.polarity] += n

			scores[q.dimension][MBTI_OPPOSITE[q.polarity]] += 6 - n
		})

		const type = Object.keys(MBTI_PAIRS).map(d => {
			const pair = MBTI_PAIRS[d]

			return scores[d][pair[0]] >= scores[d][pair[1]]
				? pair[0]
				: pair[1]
		}).join('')

		const dimensions = {}

		Object.keys(MBTI_PAIRS).forEach(d => {
			const pair = MBTI_PAIRS[d]

			const total =
				scores[d][pair[0]] +
				scores[d][pair[1]]

			dimensions[d] = {
				scores: scores[d],

				preference:
					scores[d][pair[0]] >= scores[d][pair[1]]
						? pair[0]
						: pair[1],

				first_percent: Math.round(
					scores[d][pair[0]] / total * 100
				),

				second_percent: Math.round(
					scores[d][pair[1]] / total * 100
				)
			}
		})

		return {
			test_code: testCode,
			title: 'MBTI性格偏好报告',
			type: type,
			dimensions: dimensions,
			detail_names: MBTI_NAMES,

			summary:
				'本次答题呈现的偏好组合为' +
				type +
				'。结果仅反映当前答题倾向，不代表能力高低或固定人格标签。'
		}
	}

	// ==================== 霍兰德评分 ====================
	if (testCode === 'holland') {
		const scores = {
			R: 0,
			I: 0,
			A: 0,
			S: 0,
			E: 0,
			C: 0
		}

		questions.forEach(q => {
			if (scores[q.dimension] === undefined) {
				throw new Error('霍兰德题目维度配置错误')
			}

			scores[q.dimension] += Number(answerMap[q.question_id])
		})

		const ranking = Object.keys(scores).map(code => ({
			code: code,
			name: HOLLAND_NAMES[code],
			score: scores[code]
		})).sort((a, b) => {
			return b.score - a.score ||
				a.code.localeCompare(b.code)
		})

		return {
			test_code: testCode,
			title: '霍兰德职业兴趣报告',
			code: ranking.slice(0, 3).map(x => x.code).join(''),
			scores: scores,
			ranking: ranking,

			summary:
				'主要兴趣倾向为' +
				ranking.slice(0, 3).map(function(x) {
					return x.name
				}).join('、') +
				'。兴趣不等同于能力或职业资格。'
		}
	}

	// ==================== 职业能力评分 ====================
	if (testCode === 'ability') {
		const stats = {}
		const answerDetails = []

		questions.forEach(q => {
			const dimension = q.dimension

			if (!ABILITY_NAMES[dimension]) {
				throw new Error('职业能力题目维度配置错误：' + dimension)
			}

			if (!stats[dimension]) {
				stats[dimension] = {
					correct: 0,
					total: 0
				}
			}

			stats[dimension].total++

			const answer = String(answerMap[q.question_id])
			const correct = String(q.correct_answer)
			const isCorrect = answer === correct

			if (isCorrect) {
				stats[dimension].correct++
			}

			const userOption = (q.options || []).find(
				o => String(o.value) === answer
			)

			const correctOption = (q.options || []).find(
				o => String(o.value) === correct
			)

			answerDetails.push({
				question_id: q.question_id,
				sort: q.sort,
				title: q.title || q.question,

				user_answer: answer,

				user_answer_label: userOption
					? (userOption.label || userOption.text)
					: answer,

				correct: isCorrect,
				correct_answer: correct,

				correct_answer_label: correctOption
					? (correctOption.label || correctOption.text)
					: correct,

				explanation: q.explanation || ''
			})
		})

		const dimensions = Object.keys(ABILITY_NAMES).map(code => {
			const x = stats[code] || {
				correct: 0,
				total: 0
			}

			return {
				code: code,
				name: ABILITY_NAMES[code],
				correct: x.correct,
				total: x.total,
				rate: x.total
					? Math.round(x.correct / x.total * 100)
					: 0
			}
		})

		const correctCount = answerDetails.filter(
			x => x.correct
		).length

		const rate = Math.round(
			correctCount / questions.length * 100
		)

		const level = rate >= 80
			? '表现较好'
			: (rate >= 60 ? '基础良好' : '继续练习')

		return {
			test_code: testCode,
			title: '职业能力测试报告',
			correct_count: correctCount,
			total_count: questions.length,
			score: rate,
			level: level,
			dimensions: dimensions,
			answer_details: answerDetails,

			summary:
				'本次答对' +
				correctCount +
				'题，共' +
				questions.length +
				'题，正确率' +
				rate +
				'%。该结果仅反映本套基础练习题中的表现。'
		}
	}

	// ==================== 职业价值观评分 ====================
	if (testCode === 'value') {
		const scores = {}

		questions.forEach(q => {
			if (!VALUE_NAMES[q.dimension]) {
				throw new Error('职业价值观题目维度配置错误')
			}

			scores[q.dimension] =
				(scores[q.dimension] || 0) +
				Number(answerMap[q.question_id])
		})

		const ranking = Object.keys(VALUE_NAMES).map(code => ({
			code: code,
			name: VALUE_NAMES[code],
			score: scores[code] || 0,
			average: Number(
				((scores[code] || 0) / 4).toFixed(2)
			)
		})).sort((a, b) => {
			return b.score - a.score ||
				a.code.localeCompare(b.code)
		})

		return {
			test_code: testCode,
			title: '职业价值观报告',
			scores: scores,
			ranking: ranking,

			code: ranking.slice(0, 3).map(
				x => x.code
			).join(','),

			summary:
				'你相对重视的职业因素包括：' +
				ranking.slice(0, 3).map(function(x) {
					return x.name
				}).join('、') +
				'。这些偏好可用于判断岗位和工作环境是否符合期待。'
		}
	}

	throw new Error('不支持的测评类型')
}


// ============================================================
// 云对象接口
// ============================================================

module.exports = {

	// ==================== 原有职业档案接口 ====================

	async getProfile(token) {
		try {
			const userId = await resolveUserId(this, token)

			const res = await db.collection('user_profiles')
				.where({ user_id: userId })
				.limit(1)
				.get()

			return ok(
				res.data && res.data.length ? res.data[0] : null,
				'获取成功'
			)
		} catch (e) {
			return fail(e.message, 401)
		}
	},

	async saveProfile(data = {}, token) {
		try {
			const userId = await resolveUserId(this, token)

			if (!data.major || !data.grade) {
				return fail('专业和年级不能为空', 400)
			}

			const profileData = {
				user_id: userId,
				major: data.major,
				grade: data.grade,
				school: data.school || '',

				interests: Array.isArray(data.interests)
					? data.interests
					: [],

				target_job_ids: Array.isArray(data.target_job_ids)
					? data.target_job_ids
					: [],

				updated_at: Date.now()
			}

			const old = await db.collection('user_profiles')
				.where({ user_id: userId })
				.limit(1)
				.get()

			if (old.data && old.data.length) {
				await db.collection('user_profiles')
					.doc(old.data[0]._id)
					.update(profileData)
			} else {
				await db.collection('user_profiles').add({
					...profileData,
					created_at: Date.now()
				})
			}

			return ok(null, '保存成功')
		} catch (e) {
			return fail(e.message, 401)
		}
	},

	/**
	 * 旧版提交接口不再接受客户端传入的正确率。
	 * 新版117题测评必须使用 submitNewAssessment。
	 */
	async submitAssessment(data = {}) {
		return fail(
			'请使用新版 submitNewAssessment 提交完整答题记录，云端会自动判分。',
			400
		)
	},


	// ==================== 原有岗位与成长接口 ====================

	async getJobs() {
		try {
			const res = await db.collection('career_jobs')
				.where({ status: 'active' })
				.get()

			return ok(res.data || [])
		} catch (e) {
			return fail(e.message)
		}
	},

	async matchJob(jobId, token) {
		try {
			const userId = await resolveUserId(this, token)

			if (!jobId) {
				return fail('缺少岗位ID', 400)
			}

			// 兼容两种数据结构：
			// 1) doc(id).get() 在部分 uniCloud 版本返回 data 为对象
			// 2) 另一些版本返回 data 为数组
			const jobRes = await db.collection('career_jobs')
				.doc(String(jobId))
				.get()

			const rawJobData = jobRes && jobRes.data
			const job = Array.isArray(rawJobData)
				? (rawJobData[0] || null)
				: (rawJobData && typeof rawJobData === 'object'
					? rawJobData
					: null)

			if (!job) {
				return fail('岗位不存在', 404)
			}

			const skillRes = await db.collection('user_skills')
				.where({ user_id: userId })
				.get()

			const userSkills = {}

			;(skillRes.data || []).forEach(item => {
				if (item.skill_code && item.score !== undefined) {
					userSkills[item.skill_code] = Number(item.score)
				}
			})

			// 兜底：user_skills 无数据时，从最近一次 ability 报告提炼能力，
			// 保证匹配分不会因同步失败而恒为 0。
			if (!Object.keys(userSkills).length) {
				try {
					const abilityRes = await db.collection('assessment_results')
						.where({ user_id: userId, test_code: 'ability' })
						.orderBy('created_at', 'desc')
						.limit(1)
						.get()

					const abilityReport = abilityRes.data && abilityRes.data[0]
						? (abilityRes.data[0].report || abilityRes.data[0])
						: null

					if (abilityReport && Array.isArray(abilityReport.dimensions)) {
						abilityReport.dimensions.forEach(item => {
							const radarCode = ABILITY_TO_RADAR[item.code] || item.code
							const score = item.rate !== undefined
								? item.rate
								: item.score
							if (score !== undefined) {
								userSkills[radarCode] = Number(score)
							}
						})
						if (abilityReport.score !== undefined) {
							userSkills.career = Number(abilityReport.score)
						}
					}
				} catch (e) {
					console.error('[career-service.matchJob] 能力兜底失败', e)
				}
			}

			// 岗位权重字段兼容多种历史命名
			const weights = job.skills_weights ||
				job.skill_weights ||
				job.weights ||
				{}

			let weighted = 0
			let weightSum = 0

			const missingSkills = []
			const details = []

			Object.entries(weights).forEach(
				([skillCode, weight]) => {
					const score = userSkills[skillCode]

					if (score === undefined || Number.isNaN(score)) {
						missingSkills.push(skillCode)

						details.push({
							skill_code: skillCode,
							skill_name: RADAR_SKILL_NAMES[skillCode] || skillCode,
							weight: Number(weight),
							user_score: null,
							status: 'missing'
						})
					} else {
						weighted += Number(weight) * Number(score)
						weightSum += Number(weight)

						details.push({
							skill_code: skillCode,
							skill_name: RADAR_SKILL_NAMES[skillCode] || skillCode,
							weight: Number(weight),
							user_score: score,
							status: 'normal'
						})
					}
				}
			)

			const matchScore = weightSum
				? Math.round(weighted / weightSum)
				: 0

			const level = matchScore >= 80
				? '高度匹配'
				: (matchScore >= 60
					? '较为匹配'
					: (matchScore >= 40 ? '有一定匹配度' : '匹配度较低'))

			return ok({
				job: job,
				matchScore: matchScore,
				level: level,
				details: details,
				missingSkills: missingSkills,

				// 兼容可能仍使用下划线命名的旧调用方
				match_score: matchScore,
				missing_skills: missingSkills,

				summary:
					'当前岗位匹配度为' +
					matchScore +
					'%，' +
					(
						missingSkills.length
							? '部分能力数据尚未完善，建议完成更多测评。'
							: '已根据现有能力数据完成匹配。'
					)
			})
		} catch (e) {
			console.error('[career-service.matchJob]', e)
			return fail(e.message || '计算匹配度失败', 401)
		}
	},

	async getGrowthOverview(token) {
		try {
			const userId = await resolveUserId(this, token)

			const [skillRes, recordRes, aiRes] = await Promise.all([
				db.collection('user_skills')
					.where({ user_id: userId })
					.orderBy('score', 'desc')
					.get(),

				db.collection('assessment_records')
					.where({ user_id: userId })
					.orderBy('created_at', 'desc')
					.limit(10)
					.get(),

				db.collection('ai_records')
					.where({ user_id: userId })
					.orderBy('created_at', 'desc')
					.limit(10)
					.get()
			])

			const assessments = (recordRes.data || []).map(item => ({
				...item,
				category_code: item.test_code || item.category_code,
				test_name: item.test_name || item.test_code
			}))

			return ok({
				skills: skillRes.data || [],
				// records 为原有字段，保留兼容；assessments/aiRecords 为成长页新增字段
				records: assessments,
				assessments: assessments,
				aiRecords: aiRes.data || []
			})
		} catch (e) {
			return fail(e.message, 401)
		}
	},

	async getDashboardData(token) {
		try {
			const userId = await resolveUserId(this, token)

			const [
				profileRes,
				assessmentCountRes,
				aiCountRes,
				skillsRes
			] = await Promise.all([
				db.collection('user_profiles')
					.where({ user_id: userId })
					.limit(1)
					.get(),

				db.collection('assessment_records')
					.where({ user_id: userId })
					.count(),

				db.collection('ai_records')
					.where({ user_id: userId })
					.count(),

				db.collection('user_skills')
					.where({ user_id: userId })
					.orderBy('score', 'desc')
					.limit(3)
					.get()
			])

			return ok({
				profile: profileRes.data && profileRes.data[0] || null,
				assessmentCount: assessmentCountRes.total || 0,
				aiCount: aiCountRes.total || 0,
				topSkills: skillsRes.data || []
			})
		} catch (e) {
			return fail(e.message, 401)
		}
	},

	async initJobsData() {
		try {
			const countRes = await db.collection('career_jobs').count()

			if (countRes.total > 5) {
				return ok(null, '岗位数据已存在，无需重复导入')
			}

			const jobList = [
				{
					job_name: 'Java后端开发工程师',
					job_category: '技术研发',
					description: '负责公司核心业务系统的后端架构设计与代码编写。',
					skills_weights: {
						professional: 0.5,
						logic: 0.3,
						practice: 0.2
					},
					status: 'active'
				},
				{
					job_name: '新媒体运营',
					job_category: '产品运营',
					description: '负责公众号、小红书等平台的日常内容策划与文案撰写。',
					skills_weights: {
						communication: 0.5,
						digital: 0.3,
						professional: 0.2
					},
					status: 'active'
				},
				{
					job_name: '数据分析师',
					job_category: '数据智能',
					description: '负责业务数据的提取、清洗与可视化分析，提供决策支持。',
					skills_weights: {
						digital: 0.4,
						logic: 0.4,
						professional: 0.2
					},
					status: 'active'
				},
				{
					job_name: '测试工程师',
					job_category: '技术研发',
					description: '负责软件产品的功能测试、接口测试及自动化测试脚本编写。',
					skills_weights: {
						logic: 0.4,
						professional: 0.4,
						practice: 0.2
					},
					status: 'active'
				}
			]

			for (const job of jobList) {
				await db.collection('career_jobs').add(job)
			}

			return ok(
				{ count: jobList.length },
				'成功导入4条岗位数据'
			)
		} catch (e) {
			return fail(e.message)
		}
	},

	async getExploreData(token) {
		try {
			const userId = await resolveUserId(this, token)

			const [profileRes, skillsRes, jobsRes] = await Promise.all([
				db.collection('user_profiles')
					.where({ user_id: userId })
					.limit(1)
					.get(),

				db.collection('user_skills')
					.where({ user_id: userId })
					.orderBy('score', 'desc')
					.limit(3)
					.get(),

				db.collection('career_jobs')
					.where({ status: 'active' })
					.limit(3)
					.get()
			])

			let topSkills = skillsRes.data || []

			// 兜底：若 user_skills 尚无数据（例如能力测评通过旧版本提交、
			// 或同步步骤失败），则从最近一次 ability 测评报告中提炼能力摘要，
			// 保证职业探索页的能力摘要不为空。
			if (!topSkills.length) {
				try {
					const abilityRes = await db.collection('assessment_results')
						.where({ user_id: userId, test_code: 'ability' })
						.orderBy('created_at', 'desc')
						.limit(1)
						.get()

					const abilityReport = abilityRes.data && abilityRes.data[0]
						? (abilityRes.data[0].report || abilityRes.data[0])
						: null

					if (abilityReport && Array.isArray(abilityReport.dimensions)) {
						topSkills = abilityReport.dimensions
							.map(item => {
								const radarCode = ABILITY_TO_RADAR[item.code] || item.code
								return {
									skill_code: radarCode,
									name: RADAR_SKILL_NAMES[radarCode] || item.name,
									score: item.rate !== undefined
										? item.rate
										: (item.score || 0),
									source: 'assessment_fallback'
								}
							})
							.sort((a, b) => Number(b.score) - Number(a.score))
							.slice(0, 3)
					}
				} catch (e) {
					console.error('[career-service.getExploreData] 能力摘要兜底失败', e)
				}
			}

			return ok({
				profile: profileRes.data && profileRes.data[0] || null,
				topSkills: topSkills,
				recommendedJobs: jobsRes.data || []
			})
		} catch (e) {
			return fail(e.message, 401)
		}
	},


	// ==================== 新版117题职业测评接口 ====================

	/**
	 * 获取测评列表及完成状态。
	 */
	async getAssessmentList(token) {
		try {
			const userId = await getAssessmentUser(token)

			const history = await db.collection('assessment_records')
				.where({ user_id: userId })
				.orderBy('created_at', 'desc')
				.limit(100)
				.get()

			const completed = {}

			;(history.data || []).forEach(x => {
				if (!completed[x.test_code]) {
					completed[x.test_code] = true
				}
			})

			return ok(TEST_CONFIG.map(x => ({
				...x,
				completed: !!completed[x.test_code]
			})))
		} catch (e) {
			return fail(e.message, 401)
		}
	},

	/**
	 * 获取指定测评题目。
	 */
	async getAssessmentQuestions(testCode, token) {
		try {
			await getAssessmentUser(token)

			if (!TEST_CODES.includes(testCode)) {
				return fail('测评类型不存在', 400)
			}

			const res = await db.collection('assessment_questions')
				.where({
					test_code: testCode,
					status: 1
				})
				.orderBy('sort', 'asc')
				.get()

			const questions = (res.data || []).map(publicQuestion)

			const config = TEST_CONFIG.find(
				x => x.test_code === testCode
			)

			const expected = config.question_count

			if (questions.length !== expected) {
				return fail(
					'题库数量不完整：当前' +
					questions.length +
					'题，应为' +
					expected +
					'题'
				)
			}

			return ok({
				test_code: testCode,
				questions: questions,
				total: questions.length
			})
		} catch (e) {
			return fail(e.message, 401)
		}
	},

	/**
	 * 提交完整答题记录。
	 * 服务端验证答案并自动评分。
	 */
	async submitNewAssessment(payload = {}) {
		try {
			const testCode = payload.testCode

			const userId = await getAssessmentUser(payload.token)

			if (!TEST_CODES.includes(testCode)) {
				return fail('测评类型不正确', 400)
			}

			if (!Array.isArray(payload.answers)) {
				return fail('答题数据格式不正确', 400)
			}

			const questionRes = await db.collection('assessment_questions')
				.where({
					test_code: testCode,
					status: 1
				})
				.orderBy('sort', 'asc')
				.get()

			const questions = questionRes.data || []

			const config = TEST_CONFIG.find(
				x => x.test_code === testCode
			)

			const expected = config.question_count

			if (questions.length !== expected) {
				return fail(
					'题库未完整初始化：当前' +
					questions.length +
					'题，应为' +
					expected +
					'题',
					400
				)
			}

			if (payload.answers.length !== questions.length) {
				return fail(
					'请完成全部' + questions.length + '道题目',
					400
				)
			}

			const answerMap = {}

			for (const item of payload.answers) {
				const id = String(
					item && (item.question_id || item.id) || ''
				)

				if (
					!id ||
					Object.prototype.hasOwnProperty.call(answerMap, id)
				) {
					return fail(
						'答案中存在空题目编号或重复题目',
						400
					)
				}

				answerMap[id] = item.answer
			}

			if (Object.keys(answerMap).length !== questions.length) {
				return fail('答案数量不正确', 400)
			}

			for (const q of questions) {
				const questionId = String(q.question_id)

				if (!Object.prototype.hasOwnProperty.call(answerMap, questionId)) {
					return fail('第' + q.sort + '题未作答', 400)
				}

				if (!validateAnswer(q, answerMap[questionId])) {
					return fail('第' + q.sort + '题答案无效', 400)
				}

				const allowed = (q.options || []).some(
					o => String(o.value) === String(answerMap[questionId])
				)

				if (!allowed) {
					return fail('第' + q.sort + '题选项无效', 400)
				}
			}

			// 服务端计算报告
			const report = scoreAssessment(
				testCode,
				questions,
				answerMap
			)

			const now = Date.now()

			const recordData = {
				user_id: userId,
				test_code: testCode,
				test_name: config.title,
				total_count: questions.length,

				correct_count: report.correct_count === undefined
					? null
					: report.correct_count,

				score: report.score === undefined
					? null
					: report.score,

				answers: questions.map(q => ({
					question_id: q.question_id,
					answer: answerMap[String(q.question_id)]
				})),

				report: report,
				created_at: now
			}

			const recordAdd = await db.collection('assessment_records')
				.add(recordData)

			const resultAdd = await db.collection('assessment_results')
				.add({
					user_id: userId,
					test_code: testCode,

					result_code:
						report.type ||
						report.code ||
						'',

					score: report.score === undefined
						? null
						: report.score,

					dimensions:
						report.dimensions ||
						report.ranking ||
						[],

					description: report.summary,
					report: report,
					record_id: recordAdd.id,
					created_at: now
				})

			// 能力测评结果同步至 user_skills
			// 修复：五项能力原始编码(logical/numerical...)与成长雷达编码
			// (logic/digital/communication/professional/practice/career)不一致，
			// 导致雷达读取不到数据。这里做映射后再写入。
			if (testCode === 'ability') {
				const skillValues = {}
				for (const item of report.dimensions || []) {
					const radarCode = ABILITY_TO_RADAR[item.code] || item.code
					skillValues[radarCode] = item.rate
				}
				// 求职能力无直接测评来源，用总体正确率作为参考值
				skillValues.career = report.score

				const upsertSkill = async (skillCode, score) => {
					const old = await db.collection('user_skills')
						.where({
							user_id: userId,
							skill_code: skillCode
						})
						.limit(1)
						.get()

					const update = {
						score: score,
						source: 'assessment',
						updated_at: now
					}

					if (old.data && old.data.length) {
						await db.collection('user_skills')
							.doc(old.data[0]._id)
							.update(update)
					} else {
						await db.collection('user_skills').add({
							user_id: userId,
							skill_code: skillCode,
							...update,
							sample_count: 1
						})
					}
				}

				for (const code of Object.keys(skillValues)) {
					await upsertSkill(code, skillValues[code])
				}
			}

			return ok({
				record_id: recordAdd.id,
				result_id: resultAdd.id,
				report: report
			}, '测评提交成功')

		} catch (e) {
			console.error(
				'[career-service.submitNewAssessment]',
				e
			)

			return fail(
				e.message || '提交测评失败',
				500
			)
		}
	},

	/**
	 * 获取用户测评历史。
	 */
	async getAssessmentHistory(token) {
		try {
			const userId = await getAssessmentUser(token)

			const res = await db.collection('assessment_records')
				.where({ user_id: userId })
				.orderBy('created_at', 'desc')
				.limit(100)
				.get()

			return ok({
				records: res.data || []
			})
		} catch (e) {
			return fail(e.message, 401)
		}
	},

	/**
	 * 获取测评报告。
	 *
	 * getAssessmentReport(token)
	 * 返回综合职业报告。
	 *
	 * getAssessmentReport('ability', token)
	 * 返回指定测评的最近一次报告。
	 */
	async getAssessmentReport(testCodeOrToken, maybeToken) {
		try {

			// 查询指定测评报告
			if (
				maybeToken &&
				TEST_CODES.includes(testCodeOrToken)
			) {
				const userId = await getAssessmentUser(maybeToken)

				const res = await db.collection('assessment_results')
					.where({
						user_id: userId,
						test_code: testCodeOrToken
					})
					.orderBy('created_at', 'desc')
					.limit(1)
					.get()

				if (!res.data || !res.data.length) {
					return fail('暂时没有该类型的测评报告', 404)
				}

				return ok(res.data[0].report)
			}

			// 查询综合报告
			const userId = await getAssessmentUser(testCodeOrToken)

			const res = await db.collection('assessment_results')
				.where({ user_id: userId })
				.orderBy('created_at', 'desc')
				.limit(100)
				.get()

			const latest = {}

			;(res.data || []).forEach(x => {
				if (!latest[x.test_code]) {
					latest[x.test_code] = x.report || {}
				}
			})

			const completedTests = TEST_CODES.filter(
			    code => latest[code]
			)
			const components = []

			if (latest.ability) {
				components.push({
					code: 'ability',
					name: '职业能力',
					score: latest.ability.score
				})
			}

			if (latest.holland) {
				components.push({
					code: 'holland',
					name: '职业兴趣',
					result: latest.holland.code
				})
			}

			if (latest.mbti) {
				components.push({
					code: 'mbti',
					name: '性格偏好',
					result: latest.mbti.type
				})
			}

			if (latest.value) {
				components.push({
					code: 'value',
					name: '职业价值观',
					result: latest.value.code
				})
			}

			return ok({
				completedTests: completedTests,
				isComplete: TEST_CODES.every(
				    code => !!latest[code]
				),
				dimensions: components,

				mbti: latest.mbti || null,
				holland: latest.holland || null,
				ability: latest.ability || null,
				value: latest.value || null,

				summary: completedTests.length === 4
					? '四类测评已完成，当前报告可作为阶段性职业探索参考。'
					: '完成更多测评后，可形成更完整的职业画像。'
			})

		} catch (e) {
			return fail(e.message, 401)
		}
	},

/**
 * 获取用户综合职业画像。
 *
 * 根据四类测评的最新结果生成：
 * 1. 性格画像
 * 2. 职业兴趣画像
 * 3. 职业能力画像
 * 4. 职业价值观画像
 * 5. 优势分析
 * 6. 职业探索方向
 * 7. 能力提升建议
 */
async getCareerProfile(token) {
    try {
        const userId = await getAssessmentUser(token)

        // 分别查询四类测评最新结果
        const codes = ['mbti', 'holland', 'ability', 'value']
        const latest = {}

        for (const code of codes) {
            const res = await db.collection('assessment_results')
                .where({
                    user_id: userId,
                    test_code: code
                })
                .orderBy('created_at', 'desc')
                .limit(1)
                .get()

            if (res.data && res.data.length) {
                latest[code] = res.data[0].report || {}
            }
        }

        const completedTests = codes.filter(
            code => !!latest[code]
        )

        const isComplete = completedTests.length === 4

        // 测评未完成时仍返回已有画像
        const mbti = latest.mbti || null
        const holland = latest.holland || null
        const ability = latest.ability || null
        const value = latest.value || null

        const strengths = []
        const careerDirections = []
        const improvementAreas = []
        const developmentAdvice = []

        // ==================== 性格画像 ====================
        const personality = mbti ? {
            type: mbti.type || '',
            dimensions: mbti.dimensions || {},
            summary: mbti.summary || ''
        } : null

        // ==================== 兴趣画像 ====================
        const interest = holland ? {
            code: holland.code || '',
            scores: holland.scores || {},
            ranking: holland.ranking || [],
            summary: holland.summary || ''
        } : null

        // 霍兰德兴趣方向映射
        const hollandCareerMap = {
            R: {
                name: '现实型',
                directions: [
                    '工程技术与设备运维',
                    '机械制造与生产技术',
                    '工程施工与技术实施'
                ]
            },
            I: {
                name: '研究型',
                directions: [
                    '数据分析与研究',
                    '科学技术与研发',
                    '信息技术与系统分析'
                ]
            },
            A: {
                name: '艺术型',
                directions: [
                    '视觉设计与创意设计',
                    '内容创作与传媒',
                    '产品创意与体验设计'
                ]
            },
            S: {
                name: '社会型',
                directions: [
                    '教育培训与人才发展',
                    '人力资源与员工服务',
                    '咨询服务与社会服务'
                ]
            },
            E: {
                name: '企业型',
                directions: [
                    '市场营销与商务拓展',
                    '经营管理与项目管理',
                    '创业与商业运营'
                ]
            },
            C: {
                name: '常规型',
                directions: [
                    '财务管理与会计',
                    '行政管理与运营支持',
                    '数据管理与流程管理'
                ]
            }
        }

        if (holland && Array.isArray(holland.ranking)) {
            holland.ranking.slice(0, 3).forEach(item => {
                const info = hollandCareerMap[item.code]

                if (info) {
                    careerDirections.push({
                        code: item.code,
                        name: info.name,
                        score: item.score,
                        directions: info.directions
                    })
                }
            })

            if (holland.ranking.length) {
                strengths.push(
                    '主要职业兴趣倾向：' +
                    holland.ranking.slice(0, 3)
                        .map(x => x.name)
                        .join('、')
                )
            }
        }

        // ==================== 能力画像 ====================
        let abilityProfile = null

        if (ability) {
            const dimensions = Array.isArray(ability.dimensions)
                ? ability.dimensions
                : []

            abilityProfile = {
                score: ability.score,
                level: ability.level || '',
                correct_count: ability.correct_count,
                total_count: ability.total_count,
                dimensions: dimensions
            }

            const sorted = dimensions.slice().sort(
                (a, b) => Number(b.rate || 0) -
                    Number(a.rate || 0)
            )

            if (sorted.length) {
                const best = sorted[0]

                strengths.push(
                    '职业能力测试中表现较好的维度：' +
                    best.name +
                    '，正确率' +
                    best.rate +
                    '%'
                )

                const weakest = sorted[sorted.length - 1]

                improvementAreas.push({
                    code: weakest.code,
                    name: weakest.name,
                    rate: weakest.rate,
                    advice: '建议通过专项练习、实际任务和持续复盘提升该项能力。'
                })

                developmentAdvice.push(
                    '针对' +
                    weakest.name +
                    '安排专项训练，并通过实际任务检验提升效果。'
                )
            }
        }

        // ==================== 价值观画像 ====================
        const valueProfile = value ? {
            code: value.code || '',
            scores: value.scores || {},
            ranking: value.ranking || [],
            summary: value.summary || ''
        } : null

        if (value && Array.isArray(value.ranking)) {
            const topValues = value.ranking.slice(0, 3)

            if (topValues.length) {
                strengths.push(
                    '较重视的职业价值因素：' +
                    topValues.map(x => x.name).join('、')
                )

                developmentAdvice.push(
                    '选择职业和岗位时，建议重点考察工作环境是否符合自己的价值偏好。'
                )
            }
        }

        // ==================== 性格建议 ====================
        if (mbti && mbti.type) {
            developmentAdvice.push(
                '结合性格偏好认识自己的工作方式，同时保持对不同工作方式和团队协作模式的适应能力。'
            )
        }

        // ==================== 兴趣建议 ====================
        if (holland && holland.code) {
            developmentAdvice.push(
                '可以围绕霍兰德前三位兴趣方向开展职业探索，通过岗位体验、项目实践和职业访谈验证兴趣。'
            )
        }

        // ==================== 通用建议 ====================
        if (!isComplete) {
            developmentAdvice.push(
                '建议完成尚未进行的测评，以获得更完整的综合职业画像。'
            )
        }

        if (isComplete) {
            developmentAdvice.push(
                '建议结合真实工作经历、教育背景和个人发展目标进一步验证测评结果，不要仅凭测评代码决定职业选择。'
            )
        }

        // ==================== 画像增强字段（不改动原有统计逻辑） ====================

        // 性格画像补充：MBTI 工作特点与类型说明
        if (personality) {
            const profileType = personality.type || ''
            personality.typeProfile = MBTI_TYPE_PROFILES[profileType] || ''
            personality.workStyles = profileType.split('').map(letter => ({
                code: letter,
                name: MBTI_NAMES[letter] || letter,
                description: MBTI_WORK_STYLES[letter] || ''
            }))
        }

        // 兴趣画像补充：排序名次与占比
        if (interest && Array.isArray(interest.ranking)) {
            const scoreTotal = Object.keys(interest.scores || {})
                .reduce((sum, k) => sum + Number(interest.scores[k] || 0), 0)
            interest.ranking = interest.ranking.map((item, index) => ({
                ...item,
                rank: index + 1,
                percent: scoreTotal
                    ? Math.round(Number(item.score || 0) / scoreTotal * 100)
                    : 0
            }))
        }

        // 能力画像补充：能力特质、分层、优势与短板
        const abilityScores = {}
        if (abilityProfile) {
            abilityProfile.dimensions = (abilityProfile.dimensions || []).map(item => {
                const lv = levelOfScore(item.rate)
                return { ...item, trait: ABILITY_TRAITS[item.code] || '', level: lv.level, tone: lv.tone }
            })
            const sortedDims = abilityProfile.dimensions.slice().sort(
                (a, b) => Number(b.rate || 0) - Number(a.rate || 0)
            )
            abilityProfile.strengths = sortedDims.slice(0, 2).map(x => ({
                code: x.code, name: x.name, rate: x.rate
            }))
            abilityProfile.weaknesses = sortedDims.slice(-2).reverse().map(x => ({
                code: x.code, name: x.name, rate: x.rate
            }))
        }

        // 汇总成雷达六维分数（供差距分析与前端展示）
        const abilityForAlgo = ability || (abilityProfile ? {
            dimensions: abilityProfile.dimensions
        } : null)
        if (abilityForAlgo && Array.isArray(abilityForAlgo.dimensions)) {
            abilityForAlgo.dimensions.forEach(item => {
                const radarCode = ABILITY_TO_RADAR[item.code]
                if (radarCode) abilityScores[radarCode] = Number(item.rate) || 0
            })
        }
        if (ability) abilityScores.career = Number(ability.score) || 0

        // 价值画像补充：排序名次
        if (valueProfile && Array.isArray(valueProfile.ranking)) {
            valueProfile.ranking = valueProfile.ranking.map((item, index) => ({
                ...item,
                rank: index + 1
            }))
        }

        // 职业方向推荐算法（覆盖基于霍兰德的初级方向，信息更完整）
        const recommended = recommendCareerDirections({
            mbti: mbti,
            holland: holland,
            ability: abilityForAlgo,
            value: value
        })
        if (recommended.length) careerDirections.length = 0, careerDirections.push(...recommended)

        // 个人能力差距分析
        const abilityGap = buildAbilityGapAnalysis(careerDirections, abilityScores)

        const missingTests = codes.filter(x => !completedTests.includes(x))

        return ok({
            completedTests: completedTests,
            isComplete: isComplete,
            missingTests: missingTests,

            profile: {
                mbti: personality,
                holland: interest,
                ability: abilityProfile,
                value: valueProfile
            },

            radarSkills: abilityScores,
            strengths: strengths,
            careerDirections: careerDirections,
            improvementAreas: improvementAreas,
            abilityGap: abilityGap,
            developmentAdvice: developmentAdvice,

            summary: isComplete
                ? '四类职业测评已完成，已形成初步综合职业画像与职业方向推荐。'
                : '当前画像基于已完成的测评结果，完成其他测评后可进一步完善。'
        }, '综合职业画像获取成功')

    } catch (e) {
        console.error(
            '[career-service.getCareerProfile]',
            e
        )

        return fail(
            e.message || '获取综合职业画像失败',
            500
        )
    }
},

	/**
	 * 管理员初始化题库。
	 *
	 * 需要在云函数环境配置：
	 * ASSESSMENT_INIT_KEY
	 *
	 * 调用时传入相同密钥。
	 */
	async initAssessmentQuestions(adminKey) {
		try {
			const expectedKey = process.env.ASSESSMENT_INIT_KEY

			if (
				!expectedKey ||
				!adminKey ||
				adminKey !== expectedKey
			) {
				return fail('无权执行题库初始化', 403)
			}

			const questions = assessmentBank.buildQuestions()

			if (questions.length !== 117) {
				return fail(
					'题库数量错误：当前' +
					questions.length +
					'题，应为117题'
				)
			}

			// 初始化前清理四类测评旧题库。
			// 请勿在用户正在答题时执行初始化。
			for (const code of TEST_CODES) {
				await db.collection('assessment_questions')
					.where({ test_code: code })
					.remove()
			}

			// 分批写入题库
			for (let i = 0; i < questions.length; i += 20) {
				const batch = questions.slice(i, i + 20)

				await db.collection('assessment_questions')
					.add(batch)
			}

			return ok({
				total: 117,
				mbti: 32,
				holland: 36,
				ability: 25,
				value: 24
			}, '117道题库初始化完成')

		} catch (e) {
			console.error(
				'[career-service.initAssessmentQuestions]',
				e
			)

			return fail(
				e.message || '题库初始化失败'
			)
		}
	}
}
