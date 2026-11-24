
const db = uniCloud.database()
const _ = db.command
const crypto = require('crypto')
const { promisify } = require('util')

const scrypt = promisify(crypto.scrypt)

let vkmail
try {
	vkmail = require('vk-mail')
} catch (error) {
	console.error('[auth-service] vk-mail 加载失败：', error)
}

// QQ 邮箱 SMTP 配置
const emailConfig = {
	host: 'smtp.qq.com',
	port: 465,
	secure: true,
	auth: {
		user: 'caves_1119@qq.com',
		pass: 'zhxiegtrgrgvgcad'
	}
}

const CODE_EXPIRES_MS = 10 * 60 * 1000
const CODE_RESEND_INTERVAL_MS = 60 * 1000
const CODE_MAX_ATTEMPTS = 5
const SESSION_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000

function result(code, msg, data = null) {
	return { code, msg, data }
}

function normalizeEmail(email) {
	return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function validEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function sha256(value) {
	return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function randomCode() {
	return crypto.randomInt(100000, 1000000).toString()
}

function validPassword(password) {
	return typeof password === 'string' &&
		password.length >= 8 &&
		password.length <= 64
}

// 使用 scrypt 加盐哈希密码，不保存明文密码
async function hashPassword(password) {
	const salt = crypto.randomBytes(16).toString('hex')
	const derivedKey = await scrypt(password, salt, 64)

	return {
		password_salt: salt,
		password_hash: derivedKey.toString('hex')
	}
}

async function verifyPassword(password, salt, hash) {
	if (!salt || !hash) return false

	const derivedKey = await scrypt(password, salt, 64)
	const storedKey = Buffer.from(hash, 'hex')

	if (storedKey.length !== derivedKey.length) return false

	return crypto.timingSafeEqual(derivedKey, storedKey)
}

async function findUserByEmail(email) {
	const res = await db.collection('users')
		.where({ email })
		.limit(1)
		.get()

	return res.data && res.data.length ? res.data[0] : null
}

async function sendMail(email, code) {
	if (!vkmail) {
		throw new Error('vk-mail 公共模块未安装')
	}

	if (
		!emailConfig.auth.user ||
		!emailConfig.auth.pass ||
		emailConfig.auth.user.includes('替换为') ||
		emailConfig.auth.pass.includes('替换为')
	) {
		throw new Error('邮件服务尚未配置')
	}

	const transporter = vkmail.createTransport(emailConfig)

	await transporter.sendMail({
		from: `职航AI <${emailConfig.auth.user}>`,
		to: email,
		subject: '【职航AI】注册验证码',
		text: `您好！\n\n你的职航AI注册验证码是：${code}\n\n验证码有效期为10分钟，请勿向任何人透露此验证码。如非本人操作，请忽略此邮件。\n\n职航AI团队`
	})
}

async function verifyRegisterCode(email, code) {
	const now = Date.now()

	const records = await db.collection('email_verification_codes')
		.where({ email, purpose: 'register' })
		.orderBy('created_at', 'desc')
		.limit(1)
		.get()

	if (!records.data || !records.data.length) {
		return { ok: false, message: '验证码不存在或已失效，请重新获取' }
	}

	const record = records.data[0]

	if (record.expires_at <= now) {
		await db.collection('email_verification_codes').doc(record._id).remove()
		return { ok: false, message: '验证码已过期，请重新获取' }
	}

	if ((record.attempts || 0) >= CODE_MAX_ATTEMPTS) {
		await db.collection('email_verification_codes').doc(record._id).remove()
		return { ok: false, message: '验证码错误次数过多，请重新获取' }
	}

	if (record.code_hash !== sha256(code)) {
		await db.collection('email_verification_codes').doc(record._id).update({
			attempts: (record.attempts || 0) + 1
		})

		return { ok: false, message: '验证码错误' }
	}

	await db.collection('email_verification_codes').doc(record._id).remove()

	return { ok: true }
}

async function createSession(user) {
	const now = Date.now()
	const token = crypto.randomBytes(32).toString('hex')

	await db.collection('user_sessions').add({
		user_id: user._id,
		token_hash: sha256(token),
		created_at: now,
		expires_at: now + SESSION_EXPIRES_MS,
		revoked: false
	})

	return {
		token,
		expiresAt: now + SESSION_EXPIRES_MS
	}
}

function publicUser(user) {
	return {
		userId: user._id,
		email: user.email,
		nickname: user.nickname
	}
}

module.exports = {
	/**
	 * 仅用于注册的邮箱验证码
	 */
	async sendCode(email) {
		email = normalizeEmail(email)

		if (!validEmail(email)) {
			return result(400, '邮箱格式不正确')
		}

		try {
			const existingUser = await findUserByEmail(email)

			if (existingUser) {
				return result(409, '该邮箱已注册，请直接登录')
			}

			const now = Date.now()

			const recent = await db.collection('email_verification_codes')
				.where({
					email,
					purpose: 'register',
					created_at: _.gt(now - CODE_RESEND_INTERVAL_MS)
				})
				.limit(1)
				.get()

			if (recent.data && recent.data.length) {
				return result(429, '验证码发送过于频繁，请稍后再试')
			}

			const code = randomCode()

			// 先发送邮件，成功后再保存验证码
			await sendMail(email, code)

			await db.collection('email_verification_codes').add({
				email,
				purpose: 'register',
				code_hash: sha256(code),
				attempts: 0,
				expires_at: now + CODE_EXPIRES_MS,
				created_at: now
			})

			return result(0, '验证码已发送')
		} catch (error) {
			console.error('[sendCode]', error)
			return result(-1, '验证码发送失败，请稍后重试')
		}
	},

	/**
	 * 注册：邮箱验证码 + 密码
	 * 参数：email、code、password、nickname
	 */
	async registerWithCode(email, code, password, nickname = '') {
		email = normalizeEmail(email)
		code = typeof code === 'string' ? code.trim() : ''
		nickname = typeof nickname === 'string' ? nickname.trim().slice(0, 30) : ''

		if (!validEmail(email)) {
			return result(400, '邮箱格式不正确')
		}

		if (!/^\d{6}$/.test(code)) {
			return result(400, '请输入正确的6位验证码')
		}

		if (!validPassword(password)) {
			return result(400, '密码长度必须为8至64位')
		}

		try {
			const existingUser = await findUserByEmail(email)

			if (existingUser) {
				return result(409, '该邮箱已注册，请直接登录')
			}

			const verification = await verifyRegisterCode(email, code)

			if (!verification.ok) {
				return result(400, verification.message)
			}

			// 再次检查，降低并发重复注册的概率
			const duplicate = await findUserByEmail(email)

			if (duplicate) {
				return result(409, '该邮箱已注册，请直接登录')
			}

			const passwordData = await hashPassword(password)
			const now = Date.now()

			const userData = {
				email,
				nickname: nickname || email.split('@')[0],
				...passwordData,
				created_at: now,
				updated_at: now,
				status: 1
			}

			const addRes = await db.collection('users').add(userData)

			const user = {
				_id: addRes.id,
				...userData
			}

			const session = await createSession(user)

			return result(0, '注册成功', {
				...publicUser(user),
				token: session.token,
				expiresAt: session.expiresAt
			})
		} catch (error) {
			console.error('[registerWithCode]', error)
			return result(-1, '注册失败，请稍后重试')
		}
	},

	/**
	 * 密码登录：不再需要邮箱验证码
	 * 参数：email、password
	 */
	async loginWithPassword(email, password) {
		email = normalizeEmail(email)

		if (!validEmail(email)) {
			return result(400, '邮箱格式不正确')
		}

		if (typeof password !== 'string' || !password.length || password.length > 64) {
			return result(400, '请输入正确的密码')
		}

		try {
			const user = await findUserByEmail(email)

			if (!user) {
				return result(404, '邮箱或密码错误')
			}

			if (user.status === 0) {
				return result(403, '账号已停用，请联系管理员')
			}

			// 兼容以前注册的老账号：旧账号没有 password_hash
			if (!user.password_hash || !user.password_salt) {
				return result(403, '该账号尚未设置密码，请完成密码设置')
			}

			const passwordCorrect = await verifyPassword(
				password,
				user.password_salt,
				user.password_hash
			)

			if (!passwordCorrect) {
				return result(401, '邮箱或密码错误')
			}

			const session = await createSession(user)

			return result(0, '登录成功', {
				...publicUser(user),
				token: session.token,
				expiresAt: session.expiresAt
			})
		} catch (error) {
			console.error('[loginWithPassword]', error)
			return result(-1, '登录失败，请稍后重试')
		}
	},

	/**
	 * 验证登录状态
	 */
	async verifySession(token) {
		if (!token || typeof token !== 'string') {
			return result(401, '请先登录')
		}

		try {
			const sessions = await db.collection('user_sessions')
				.where({
					token_hash: sha256(token),
					revoked: false,
					expires_at: _.gt(Date.now())
				})
				.limit(1)
				.get()

			if (!sessions.data || !sessions.data.length) {
				return result(401, '登录状态已失效，请重新登录')
			}

			const session = sessions.data[0]
			const userRes = await db.collection('users').doc(session.user_id).get()

			if (!userRes.data || !userRes.data.length) {
				return result(401, '用户不存在')
			}

			const user = userRes.data[0]

			if (user.status === 0) {
				return result(403, '账号已停用')
			}

			return result(0, '验证通过', publicUser(user))
		} catch (error) {
			console.error('[verifySession]', error)
			return result(-1, '会话验证失败')
		}
	},

	/**
	 * 退出登录
	 */
	async logout(token) {
		if (!token || typeof token !== 'string') {
			return result(400, '缺少登录凭证')
		}

		try {
			await db.collection('user_sessions')
				.where({
					token_hash: sha256(token),
					revoked: false
				})
				.update({
					revoked: true,
					revoked_at: Date.now()
				})

			return result(0, '已退出登录')
		} catch (error) {
			console.error('[logout]', error)
			return result(-1, '退出登录失败')
		}
	}
}
