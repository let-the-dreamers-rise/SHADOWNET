import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

export interface Config {
  llmProvider: 'openai' | 'gemini';
  llmApiKey: string;
  llmModel: string;
  agentCount: number;
  initialBalance: number;
  decisionCycleMin: number;
  decisionCycleMax: number;
  minCycleDelay: number;
  maxCycleDelay: number;
  blockInterval: number;
  port: number;
  logLevel: string;
  frontendUrl: string;
}

function validateRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function getEnvVarAsNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${name}: ${value}`);
  }
  return parsed;
}

export function loadConfig(): Config {
  try {
    const llmProvider = validateRequiredEnvVar('LLM_PROVIDER');
    if (llmProvider !== 'openai' && llmProvider !== 'gemini') {
      throw new Error(`LLM_PROVIDER must be either openai or gemini`);
    }

    const llmApiKey = validateRequiredEnvVar('LLM_API_KEY');

    const agentCount = getEnvVarAsNumber('AGENT_COUNT', 15);
    if (agentCount < 12 || agentCount > 20) {
      throw new Error(`AGENT_COUNT must be between 12 and 20, got: ${agentCount}`);
    }

    const initialBalance = getEnvVarAsNumber('INITIAL_BALANCE', 1000);
    if (initialBalance <= 0) {
      throw new Error(`INITIAL_BALANCE must be positive`);
    }

    const decisionCycleMin = getEnvVarAsNumber('DECISION_CYCLE_MIN', 5000);
    const decisionCycleMax = getEnvVarAsNumber('DECISION_CYCLE_MAX', 10000);

    const config: Config = {
      llmProvider: llmProvider as 'openai' | 'gemini',
      llmApiKey,
      llmModel: getEnvVar('LLM_MODEL', llmProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-pro'),
      agentCount,
      initialBalance,
      decisionCycleMin,
      decisionCycleMax,
      minCycleDelay: decisionCycleMin,
      maxCycleDelay: decisionCycleMax,
      blockInterval: getEnvVarAsNumber('BLOCK_INTERVAL', 30000),
      port: getEnvVarAsNumber('PORT', 3000),
      logLevel: getEnvVar('LOG_LEVEL', 'info'),
      frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:5173')
    };

    logger.info('Configuration loaded successfully', {
      llmProvider: config.llmProvider,
      agentCount: config.agentCount,
      port: config.port,
      logLevel: config.logLevel
    });

    return config;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Configuration validation failed:', error.message);
    }
    throw error;
  }
}

// Alias for backward compatibility
export const validateConfig = loadConfig;
