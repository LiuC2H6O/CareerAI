'use strict'

// 将 createAssessmentMethods(db, verifySession) 的返回对象合并到
// career-service/index.obj.js 的 module.exports 中。
// verifySession 必须是你现有 auth-service 的真实会话校验函数。

const TESTS = {
  mbti: { count: 32, title: 'MBTI性格偏好测试' },
  holland: { count: 36, title: '霍兰德职业兴趣测试' },
  ability: { count: 25, title: '职业能力测试' },
  value: { count: 24, title: '职业价值观测试' }
}
const MBTI_OPPOSITE = { E:'I', I:'E', S:'N', N:'S', T:'F', F:'T', J:'P', P:'J' }
const MBTI_DIMENSIONS = { EI:['E','I'], SN:['S','N'], TF:['T','F'], JP:['J','P'] }
const HOLLAND_NAMES = {
  R:'现实型（动手实践）', I:'研究型（分析探索）', A:'艺术型（创意表达）',
  S:'社会型（助人合作）', E:'企业型（组织影响）', C:'常规型（秩序整理）'
}
const VALUE_NAMES = {
  stability:'工作稳定', growth:'成长发展', income:'收入回报',
  creativity:'创造自主', relationship:'人际关系', achievement:'成就价值'
}
const ABILITY_NAMES = {
  logical:'逻辑推理', numerical:'数字分析', verbal:'语言理解',
  information:'信息处理', problem:'问题解决'
}

function ok(data, message='操作成功') { return { code:0, message, data } }
function fail(message) { return { code:1, message, data:null } }

function publicQuestion(q) {
  const x = { ...q }
  delete x.correct_answer
  delete x.explanation
  return x
}

function validateAnswer(q, value) {
  if (q.test_code === 'ability') {
    return ['A','B','C','D'].includes(String(value))
  }
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 5
}

function scoreAssessment(testCode, questions, answerMap) {
  if (testCode === 'mbti') {
    const dims = { EI:{E:0,I:0}, SN:{S:0,N:0}, TF:{T:0,F:0}, JP:{J:0,P:0} }
    for (const q of questions) {
      const n = Number(answerMap[q.question_id])
      dims[q.dimension][q.polarity] += n
      dims[q.dimension][MBTI_OPPOSITE[q.polarity]] += 6 - n
    }
    const type = Object.entries(MBTI_DIMENSIONS)
      .map(([d, pair]) => dims[d][pair[0]] >= dims[d][pair[1]] ? pair[0] : pair[1]).join('')
    const dimensions = {}
    for (const [d, pair] of Object.entries(MBTI_DIMENSIONS)) {
      const total = dims[d][pair[0]] + dims[d][pair[1]]
      dimensions[d] = {
        scores: dims[d],
        preference: dims[d][pair[0]] >= dims[d][pair[1]] ? pair[0] : pair[1],
        first_percent: Math.round(dims[d][pair[0]] / total * 100),
        second_percent: Math.round(dims[d][pair[1]] / total * 100)
      }
    }
    return { test_code:testCode, title:TESTS.mbti.title, type, dimensions,
      summary:`本次答题呈现的偏好组合为${type}。结果仅用于自我探索，不是临床诊断或固定人格结论。` }
  }

  if (testCode === 'holland') {
    const scores = { R:0,I:0,A:0,S:0,E:0,C:0 }
    for (const q of questions) scores[q.dimension] += Number(answerMap[q.question_id])
    const ranking = Object.keys(scores).map(code => ({
      code, name:HOLLAND_NAMES[code], score:scores[code]
    })).sort((a,b) => b.score-a.score || a.code.localeCompare(b.code))
    return { test_code:testCode, title:TESTS.holland.title,
      code:ranking.slice(0,3).map(x=>x.code).join(''), scores, ranking,
      summary:`主要兴趣倾向为${ranking.slice(0,3).map(x=>x.code).join('')}。兴趣不等同于能力或职业资格。` }
  }

  if (testCode === 'ability') {
    const totals = {}, correct = {}, answerDetails = []
    for (const q of questions) {
      const d = q.dimension
      totals[d] = (totals[d] || 0) + 1
      correct[d] = correct[d] || 0
      const userAnswer = String(answerMap[q.question_id])
      const isCorrect = userAnswer === String(q.correct_answer)
      if (isCorrect) correct[d]++
      answerDetails.push({
        question_id:q.question_id, sort:q.sort, title:q.title,
        user_answer:userAnswer, correct_answer:q.correct_answer,
        is_correct:isCorrect, explanation:q.explanation,
        options:q.options
      })
    }
    const total = questions.length
    const correctCount = answerDetails.filter(x=>x.is_correct).length
    const rate = Math.round(correctCount / total * 100)
    const dimensions = Object.keys(totals).map(code=>({
      code, name:ABILITY_NAMES[code], correct:correct[code], total:totals[code],
      rate:Math.round(correct[code]/totals[code]*100)
    }))
    return { test_code:testCode, title:TESTS.ability.title,
      correct_count:correctCount, total_count:total, score:rate,
      level:rate>=80?'本套题表现较好':rate>=60?'本套题基础良好':'建议加强相关基础练习',
      dimensions, answer_details:answerDetails,
      summary:`答对${correctCount}/${total}题，正确率${rate}%。该结果仅代表本套基础练习题表现。` }
  }

  if (testCode === 'value') {
    const scores = {}
    for (const q of questions) scores[q.dimension] = (scores[q.dimension] || 0) + Number(answerMap[q.question_id])
    const ranking = Object.keys(scores).map(code=>({
      code, name:VALUE_NAMES[code], score:scores[code],
      average:Number((scores[code]/4).toFixed(2))
    })).sort((a,b)=>b.score-a.score || a.code.localeCompare(b.code))
    return { test_code:testCode, title:TESTS.value.title, scores, ranking,
      summary:`本次最看重的职业因素包括：${ranking.slice(0,3).map(x=>x.name).join('、')}。` }
  }
  throw new Error('不支持的测评类型')
}

function createAssessmentMethods(db, verifySession) {
  const questionsCol = db.collection('assessment_questions')
  const recordsCol = db.collection('assessment_records')
  const resultsCol = db.collection('assessment_results')

  async function currentUser(token) {
    if (!token || typeof token !== 'string') throw new Error('请先登录')
    if (typeof verifySession !== 'function') throw new Error('未配置登录态校验函数')
    const auth = await verifySession(token)
    if (!auth || auth.code !== 0 || !auth.data) throw new Error('登录状态无效或已过期')
    const uid = auth.data.user_id || auth.data.uid || auth.data._id
    if (!uid) throw new Error('登录校验未返回用户ID，请检查 auth-service.verifySession')
    return String(uid)
  }

  async function getQuestions(testCode, token) {
    await currentUser(token)
    if (!TESTS[testCode]) return fail('测评类型不存在')
    const res = await questionsCol.where({ test_code:testCode, status:1 })
      .orderBy('sort','asc').get()
    const list = res.data || []
    if (list.length !== TESTS[testCode].count) {
      return fail(`${TESTS[testCode].title}题库数量异常，应为${TESTS[testCode].count}题，当前${list.length}题`)
    }
    return ok({ test_code:testCode, questions:list.map(publicQuestion), total:list.length })
  }

  async function submit(payload={}) {
    try {
      const { testCode, answers, token } = payload
      const uid = await currentUser(token)
      if (!TESTS[testCode]) return fail('测评类型不存在')
      if (!Array.isArray(answers)) return fail('答题数据格式错误')
      const res = await questionsCol.where({ test_code:testCode, status:1 })
        .orderBy('sort','asc').get()
      const questions = res.data || []
      if (questions.length !== TESTS[testCode].count) return fail('题库未完整初始化')
      if (answers.length !== questions.length) return fail(`请完成全部${questions.length}道题目`)

      const answerMap = Object.create(null)
      for (const a of answers) {
        const id = String(a.question_id || a.id || '')
        if (!id || Object.prototype.hasOwnProperty.call(answerMap,id)) return fail('答案中存在空题号或重复题号')
        answerMap[id] = a.answer
      }
      for (const q of questions) {
        if (!Object.prototype.hasOwnProperty.call(answerMap,q.question_id)) return fail(`请完成第${q.sort}题`)
        if (!validateAnswer(q,answerMap[q.question_id])) return fail(`第${q.sort}题答案格式无效`)
      }
      if (Object.keys(answerMap).length !== questions.length) return fail('提交了不属于本套测评的题目')

      const report = scoreAssessment(testCode,questions,answerMap)
      const now = Date.now()
      const record = {
        user_id:uid, test_code:testCode,
        answers:questions.map(q=>({ question_id:q.question_id, answer:answerMap[q.question_id] })),
        report, created_at:now
      }
      const addRecord = await recordsCol.add(record)
      const addResult = await resultsCol.add({
        user_id:uid, test_code:testCode, record_id:addRecord.id,
        report, created_at:now
      })
      return ok({ record_id:addRecord.id, result_id:addResult.id, report })
    } catch(e) { return fail(e.message || '提交测评失败') }
  }

  return {
    async getAssessmentList(token) {
      try {
        await currentUser(token)
        return ok(Object.keys(TESTS).map(code=>({
          test_code:code, title:TESTS[code].title,
          question_count:TESTS[code].count
        })))
      } catch(e) { return fail(e.message) }
    },

    async getAssessmentQuestions(testCode, token) {
      try { return await getQuestions(testCode,token) }
      catch(e) { return fail(e.message || '获取题目失败') }
    },

    async submitNewAssessment(payload) { return await submit(payload) },

    // 兼容附件旧页面的 submitAssessment() 调用名称。
    // 旧页面传 correct_count/total_count 的方式不再用于正式判分，
    // 必须传完整答案数组和 token，避免客户端伪造分数。
    async submitAssessment(payload) { return await submit(payload) },

    async getAssessmentHistory(token) {
      try {
        const uid = await currentUser(token)
        const res = await recordsCol.where({ user_id:uid }).orderBy('created_at','desc').limit(100).get()
        return ok({ records:(res.data||[]).map(x=>({
          _id:x._id, test_code:x.test_code, created_at:x.created_at, report:x.report
        })) })
      } catch(e) { return fail(e.message || '获取历史失败') }
    },

    async getAssessmentReport(testCode, token) {
      try {
        // 同时兼容 getAssessmentReport(token) 和 getAssessmentReport(testCode, token)
        if (token === undefined) { token = testCode; testCode = null }
        const uid = await currentUser(token)
        const where = { user_id:uid }
        if (testCode) {
          if (!TESTS[testCode]) return fail('测评类型不存在')
          where.test_code = testCode
        }
        const res = await resultsCol.where(where).orderBy('created_at','desc').limit(testCode?1:20).get()
        if (!res.data || !res.data.length) return fail('暂无测评报告')
        if (testCode) return ok(res.data[0].report)
        return ok({ reports:res.data.map(x=>({
          test_code:x.test_code, report:x.report, created_at:x.created_at
        })) })
      } catch(e) { return fail(e.message || '获取报告失败') }
    },

    // 初始化需使用管理员密钥；密钥放云端环境变量 ASSESSMENT_INIT_KEY，
    // 不要写在前端，也不要将此方法开放给普通用户。
    async initAssessmentQuestions(adminKey) {
      try {
        const expected = process.env.ASSESSMENT_INIT_KEY
        if (!expected || !adminKey || adminKey !== expected) return fail('无权执行题库初始化')
        const bank = require('./assessment-bank')
        const list = bank.buildQuestions()
        if (list.length !== 117) return fail(`题库数据错误：${list.length}题`)
        for (const code of Object.keys(TESTS)) {
          await questionsCol.where({ test_code:code }).remove()
        }
        for (let i=0;i<list.length;i+=20) {
          await questionsCol.add(list.slice(i,i+20))
        }
        return ok({ total:list.length, counts:bank.counts },'117道题库初始化完成')
      } catch(e) { return fail(e.message || '初始化失败') }
    }
  }
}

module.exports = { createAssessmentMethods, scoreAssessment }
