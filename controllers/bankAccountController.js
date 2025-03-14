const { BankAccount } = require("../models");
const logger = require("../config/logger");

exports.createBankAccount = async (req, res) => {
    try {
        const { salesId, subAgentId, agentId, accountNumber, accountName, bankName, bankCode } = req.body;
        const bankAccount = await BankAccount.create({ salesId, subAgentId, agentId, accountNumber, accountName, bankName, bankCode });

        logger.info(`Bank account created for: ${accountName}`);
        res.status(201).json(bankAccount);
    } catch (error) {
        logger.error(`Bank account creation error: ${error.stack}`);
        res.status(500).json({ error: "Failed to create bank account" });
    }
};

exports.bankAccountListBySalesman = async (req, res) => {
    try {
        const { salesId } = req.params;
        const accounts = await BankAccount.findAll({ where: { salesId } });
        res.json(accounts);
    } catch (error) {
        logger.error(`Fetching bank accounts by salesman error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve bank accounts" });
    }
};

exports.bankAccountListBySubAgent = async (req, res) => {
    try {
        const { subAgentId } = req.params;
        const accounts = await BankAccount.findAll({ where: { subAgentId } });
        res.json(accounts);
    } catch (error) {
        logger.error(`Fetching bank accounts by subagent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve bank accounts" });
    }
};

exports.bankAccountListByAgent = async (req, res) => {
    try {
        const { agentId } = req.params;
        const accounts = await BankAccount.findAll({ where: { agentId } });
        res.json(accounts);
    } catch (error) {
        logger.error(`Fetching bank accounts by agent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve bank accounts" });
    }
};

exports.updateBankAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { salesId, subAgentId, agentId, accountNumber, accountName, bankName, bankCode } = req.body;
        const bank = await BankAccount.findByPk(id);
        if (!bank) return res.status(404).json({ error: "Bank account not found" });

        Object.assign(bank, { salesId, subAgentId, agentId, accountNumber, accountName, bankName, bankCode });
        await bank.save();

        logger.info(`Bank account created for: ${accountName}`);
        res.status(201).json(bank);
    } catch (error) {
        logger.error(`Bank account creation error: ${error.stack}`);
        res.status(500).json({ error: "Failed to create bank account" });
    }
};