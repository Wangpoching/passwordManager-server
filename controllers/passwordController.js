const bcrypt = require('bcrypt')
const copyPaste = require('copy-paste')
const generator = require('generate-password')

const passwordModel = require('../models/passwordModel')
const passwordLogger = require('../utils/passwordLogger/passwordLogger')
const encryptionUtils = require('../utils/encryption')

const mainPassword = 'IshanSingh1234'
module.exports = {
    addPassword: async (req, res) => {
        try {
            const { appPassword, serviceName, account, password } = req.body
            if (appPassword !== mainPassword) {
                passwordLogger.log('error', 'App password is incorrect.')
                return res.status(401).send({
                    success: false,
                    message: "App password is incorrect."
                })
            }
            // 檢查是否重複儲存同服務的帳密
            const isPasswordNameExist = await passwordModel.findOne({
                serviceName
            });
            if (isPasswordNameExist) {
                passwordLogger.log('error', 'Password name already exists in the database.')
                return res.status(400).send({
                    success: false,
                    message: "Password name already exists in the database."
                });
            }
            // 使用 AES 加密密碼
            const encryptedPassword = encryptionUtils.encrypt(password, appPassword);
            
            const passwordData = new passwordModel({
                ...req.body,
                password: encryptedPassword  // 儲存加密後的密碼
            });

            // 如果需要密碼歷史，也要加密儲存
            passwordData.passwordHistory = [encryptedPassword]
            await passwordData.save()
            passwordLogger.log('info', 'Password added successfully!')
            res.status(200).send({
                success: true,
                message: "Successfully add password!"
            })
            } catch (error) {
                passwordLogger.log('error', `Error: ${error.message}`)
                return res.status(500).send({
                    success: false,
                    message: "Error occurred while adding the password.",
                    error: error.message
                })
            }
    },

    /* 
    addPassword: async (req, res) => {
        try {
            const { appPassword, passwordName, password } = req.body;
            if (appPassword !== mainPassword) {
                passwordLogger.log('error', 'App password is incorrect.')
                return res.status(401).send({
                    success: false,
                    message: "App password is incorrect."
                });
            }
            // 檢查是否重複儲存同服務的帳密
            const isPasswordNameExist = await passwordModel.findOne({
                passwordName: passwordName
            });
            if (isPasswordNameExist) {
                passwordLogger.log('error', 'Password name already exists in the database.')
                return res.status(400).send({
                    success: false,
                    message: "Password name already exists in the database."
                });
            }
            // 使用 appPassword 建立 AES 對稱式加密要使用的 Key
            const passwordData = new passwordModel(req.body);
            const bcryptPassword = await bcrypt.hash(password, 10);
            passwordData.password = bcryptPassword;
            passwordData.passwordHistory.push(password);
            await passwordData.save();
            passwordLogger.log('info', 'Password added successfully!')
            return res.status(201).send({
                success: true,
                message: "Password added successfully!",
                data: passwordData
            });
        } catch (error) {
            passwordLogger, log('error', `Error: ${error.message}`)
            return res.status(500).send({
                success: false,
                message: "Error occurred while adding the password.",
                error: error.message
            });
        }
    },
    */

    listPasswords: async (req, res) => {
        try {
            const { appPassword } = req.body
            if (appPassword !== mainPassword) {
                passwordLogger.log('error', 'App password is incorrect.')
                return res.status(401).send({
                    success: false,
                    message: "App password is incorrect."
                });
            }
            const passwordsData = await passwordModel.find().select('serviceName account password')
            const passwordCount = await passwordModel.find().select('serviceName account password').count()
            // 解密
            const decryptedPasswords = passwordsData.map(item => ({
                serviceName: item.serviceName,
                account: item.account,
                password: encryptionUtils.decrypt(item.password, appPassword)
            }))

            passwordLogger.log('info', 'All passwords data found!')
            res.status(200).send({
                success: true,
                message: "All passwords data found!",
                passwordCount: passwordCount,
                passwordsData: decryptedPasswords
            })
        } catch (error) {
            passwordLogger, log('error', `Error: ${error.message}`)
            res.status(500).send({
                success: false,
                message: "Error!",
                error: error.message
            })
        }
    },

    editPassword: async (req, res) => {
        try {
            const { passwordId } = req.params
            const { appPassword, oldPassword, newPassword } = req.body
            // 找出密碼組
            const passwordData = await passwordModel.findById(passwordId)
            if (!passwordData) {
                passwordLogger.log('error', 'Cannot find corresponding password.')
                res.status(401).send({
                    success: false,
                    message: "Cannot find corresponding password!"
                })                
            }
            if (appPassword === mainPassword) {
                // 檢查舊密碼是否正確
                const isCorrectPassword = oldPassword === encryptionUtils.decrypt(passwordData.password, appPassword)
                if (isCorrectPassword) {
                    // 使用 AES 加密密碼
                    const encryptedPassword = encryptionUtils.encrypt(newPassword, appPassword)
                    passwordData.password = encryptedPassword
                    // 如果需要密碼歷史，也要加密儲存
                    passwordData.passwordHistory = [...passwordData.passwordHistory, encryptedPassword]
                    await passwordData.save()
                    passwordLogger.log('info', 'Password is successfully updated!')
                    res.status(200).send({
                        success: true,
                        message: "Password is successfully updated!",
                    })
                } else {
                    passwordLogger.log('info', 'Old password is incorrect!')
                    res.status(401).send({
                        success: false,
                        message: "Old password is incorrect!"
                    })
                }
            } else {
                passwordLogger.log('error', 'App password is incorrect.')
                res.status(401).send({
                    success: false,
                    message: "App password is incorrect!"
                })
            }
        } catch (error) {
            passwordLogger.log('error', `Error: ${error.message}`)
            res.status(500).send({
                success: false,
                message: "Error!",
                error: error.message
            })
        }
    },

    /*
    editPassword: async (req, res) => {
        try {
            const { passwordId } = req.params
            const { appPassword, ID, oldPassword, newPassword } = req.body
            const passwordData = await passwordModel.findById(passwordId)
            if (appPassword === mainPassword) {
                // 檢查舊密碼是否正確
                const isCorrectPassword = await bcrypt.compare(oldPassword, passwordData.password)
                if (isCorrectPassword) {
                    if (passwordData.passwordHistory.includes(newPassword)) {
                        passwordLogger.log('error', "You can't use used passwords")
                        return res.status(401).send({
                            success: false,
                            message: "You can't use used passwords"
                        })
                    }
                    const bcryptPassword = await bcrypt.hash(newPassword, 10)
                    passwordData.password = bcryptPassword
                    passwordData.passwordHistory.push(newPassword)
                    passwordData.save()
                    passwordLogger.log('info', 'Password is successfully updated!')
                    res.status(200).send({
                        success: true,
                        message: "Password is successfully updated!",
                    })
                } else {
                    passwordLogger.log('info', 'Old password is incorrect!')
                    res.status(401).send({
                        success: false,
                        message: "Old password is incorrect!"
                    })
                }
            } else {
                passwordLogger.log('error', 'App password is incorrect.')
                res.status(401).send({
                    success: false,
                    message: "App password is incorrect!"
                })
            }
        } catch (error) {
            passwordLogger, log('error', `Error: ${error.message}`)
            res.status(500).send({
                success: false,
                message: "Error!",
                error: error.message
            })
        }
    },
    */

    removePassword: async (req, res) => {
        try {
            const { passwordId } = req.params
            const appPassword = req.body.appPassword
            if (appPassword === mainPassword) {
                const removerPasswordData = await passwordModel.findByIdAndDelete(passwordId);
                passwordLogger.log('info', 'Password has been removed successfully!')
                res.status(200).send({
                    success: true,
                    message: "Password has been removed successfully!"
                })

            } else {
                passwordLogger.log('error', 'App password is incorrect.')
                res.status(401).send({
                    success: false,
                    message: "App password is incorrect!"
                })
            }
        } catch (error) {
            passwordLogger, log('error', `Error: ${error.message}`)
            res.status(500).send({
                success: false,
                message: "Error!",
                error: error.message
            })
        }
    },

    passwordDetails: async (req, res) => {
        try {
            const { passwordId } = req.params;
            const appPassword = req.body.appPassword;
            if (appPassword === mainPassword) {
                const passwordData = await passwordModel.findById(passwordId);
                const actualPassword = passwordData.passwordHistory[passwordData.passwordHistory.length - 1];
                copyPaste.copy(actualPassword, () => {
                    passwordLogger.log('info', 'Password is copied to clipboard.')
                    return res.status(200).send({
                        success: true,
                        message: "Password is copied to clipboard."
                    });
                });
            } else {
                passwordLogger.log('error', 'App password is incorrect.')
                return res.status(401).send({
                    success: false,
                    message: "App password is incorrect."
                });
            }
        } catch (error) {
            passwordLogger, log('error', `Error: ${error.message}`)
            return res.status(500).send({
                success: false,
                message: "Error occurred while retrieving the password.",
                error: error.message
            });
        }
    },

    passwordGenerator: async (req, res) => {
        try {
            const { passwordLength } = req.body
            const generatedPassword = await generator.generate({
                length: passwordLength,
                numbers: true,
                symbols: true,
                uppercase: true,
                lowercase: true,
                excludeSimilarCharacters: false,
            });
            passwordLogger.log('info', 'Password generated successfully')
            res.status(200).send({
                success: true,
                message: "Password generated successfully",
                generatedPassword: generatedPassword
            })
        } catch (error) {
            passwordLogger, log('error', `Error: ${error.message}`)
            return res.status(500).send({
                success: false,
                message: "Error occurred while retrieving the password.",
                error: error.message
            });
        }
    }
}
