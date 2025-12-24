const crypto = require('crypto')

// 加密工具
const encryptionUtils = {
    // 從 appPassword 生成穩定的加密密鑰
    generateKey: (appPassword) => {
        // 使用 PBKDF2 從密碼派生 256-bit 密鑰
        return crypto.pbkdf2Sync(appPassword, 'salt-key-for-password-manager', 100000, 32, 'sha256')
    },

    // 加密密碼
    encrypt: (text, appPassword) => {
        const key = encryptionUtils.generateKey(appPassword)
        const iv = crypto.randomBytes(16) // 生成隨機 IV
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
        
        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        
        const authTag = cipher.getAuthTag()
        
        // 將 IV、authTag 和加密內容組合（用 : 分隔）
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
    },

    // 解密密碼
    decrypt: (encryptedData, appPassword) => {
        const key = encryptionUtils.generateKey(appPassword)
        const parts = encryptedData.split(':')
        
        const iv = Buffer.from(parts[0], 'hex')
        const authTag = Buffer.from(parts[1], 'hex')
        const encrypted = parts[2]
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
        decipher.setAuthTag(authTag)
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        
        return decrypted
    }
};

module.exports = encryptionUtils